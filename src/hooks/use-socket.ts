import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { CardStatus } from '@/lib/supabase/types';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type CardUpdate = {
  id: string;
  status: CardStatus;
};

export type TaskUpdate = {
  id: string;
  status: TaskStatus;
};

let socket: Socket | null = null;

export function useSocket() {
  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  const subscribeToCard = useCallback((cardId: string, callback: (update: CardUpdate) => void) => {
    if (!socket) return;
    socket.on(`card:${cardId}:update`, callback);
  }, []);

  const unsubscribeFromCard = useCallback((callback: (update: CardUpdate) => void) => {
    if (!socket) return;
    socket.off('card:update', callback);
  }, []);

  const subscribeToTasks = useCallback((userId: string, callback: (update: TaskUpdate) => void) => {
    if (!socket) return;
    socket.on(`tasks:${userId}:update`, callback);
  }, []);

  const unsubscribeFromTasks = useCallback((callback: (update: TaskUpdate) => void) => {
    if (!socket) return;
    socket.off('tasks:update', callback);
  }, []);

  return {
    subscribeToCard,
    unsubscribeFromCard,
    subscribeToTasks,
    unsubscribeFromTasks,
  };
} 