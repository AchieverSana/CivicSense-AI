import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import User from '../models/User';

if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error(
      '❌ FIREBASE_SERVICE_ACCOUNT is missing or empty. Firebase Admin will not initialize. ' +
      'Make sure dotenv.config() runs before this module is imported, and that backend/.env defines FIREBASE_SERVICE_ACCOUNT.'
    );
  } else {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      serviceAccount.private_key = serviceAccount.private_key?.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized');
    } catch (err) {
      console.error('Firebase Admin init failed:', err);
    }
  }
}

async function findOrCreateFirebaseUser(decoded: admin.auth.DecodedIdToken) {
  let user = await User.findOne({ uid: decoded.uid });
  if (!user) {
    user = await User.create({
      uid: decoded.uid,
      name: decoded.name || decoded.email?.split('@')[0] || 'Civic Hero',
      email: decoded.email || `${decoded.uid}@civicsense.app`,
      avatar: decoded.picture,
    });
  }
  return user;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    (req as any).userId = 'guest';
    return next();
  }
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await findOrCreateFirebaseUser(decoded);
    (req as any).userId = user._id;
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    (req as any).userId = 'guest';
    next();
  }
}

// Requires a logged-in, non-guest user. Returns 401 if not authenticated.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if ((req as any).userId === 'guest' || !(req as any).user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Requires the user to have an admin role.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
