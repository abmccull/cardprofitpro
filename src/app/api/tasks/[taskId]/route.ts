import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { TaskStatus } from '@/hooks/use-socket';

const updateTaskSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed'] as const),
});

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const { status } = updateTaskSchema.parse(body);

    // Update task
    const { data: task, error } = await supabase
      .from('tasks')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.taskId)
      .select(`
        *,
        va:assigned_to(name)
      `)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Transform the response
    const transformedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      due_date: task.due_date,
      assigned_to: task.assigned_to,
      va_name: task.va.name,
      created_at: task.created_at,
    };

    // Emit WebSocket event for real-time updates
    const io = (await import('socket.io-client')).default;
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
    socket.emit(`tasks:${task.assigned_to}:update`, {
      id: task.id,
      status: task.status,
    });

    return NextResponse.json({ data: transformedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in task update route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 