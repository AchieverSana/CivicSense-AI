import { io, Socket } from 'socket.io-client';

// Single shared socket for the whole app — the backend already emits
// 'new-issue' / 'issue-updated' to a per-city room (see backend/src/index.ts
// and issues.controller.ts), but nothing on the frontend was listening, so
// "real-time issue tracking" silently did nothing until a manual refresh.
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
