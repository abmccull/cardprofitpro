import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest } from 'next';
import type { Socket as NetSocket } from 'net';
import type { Server as IOServer } from 'socket.io';
import { createClient } from '@/lib/supabase/server';

interface SocketServer extends HTTPServer {
  io?: IOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiRequest {
  socket: SocketWithIO;
}

export const initSocketServer = (req: NextApiResponseWithSocket) => {
  if (!req.socket.server.io) {
    const io = new Server(req.socket.server);
    req.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected');

      // Subscribe to card status changes
      socket.on('subscribeToCard', async (cardId: string) => {
        const supabase = createClient();
        
        const subscription = supabase
          .channel('card_changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'cards',
              filter: `id=eq.${cardId}`
            },
            (payload) => {
              socket.emit('cardUpdated', payload.new);
            }
          )
          .subscribe();

        socket.on('disconnect', () => {
          subscription.unsubscribe();
        });
      });

      // Subscribe to task updates
      socket.on('subscribeToTasks', async (userId: string) => {
        const supabase = createClient();
        
        const subscription = supabase
          .channel('task_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
              filter: `assigned_to=eq.${userId}`
            },
            (payload) => {
              socket.emit('taskUpdated', payload.new);
            }
          )
          .subscribe();

        socket.on('disconnect', () => {
          subscription.unsubscribe();
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  return req.socket.server.io;
}; 