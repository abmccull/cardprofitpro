'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useSocket } from '@/hooks/use-socket';
import type { TaskStatus, TaskUpdate } from '@/hooks/use-socket';

type VARole = 'grader' | 'lister' | 'researcher';

type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string;
  assigned_to: string;
  va_name: string;
  created_at: string;
};

type VA = {
  id: string;
  name: string;
  email: string;
  role: VARole;
  tasks_completed: number;
  active_tasks: number;
};

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_to: z.string().min(1, 'VA assignment is required'),
  due_date: z.string().min(1, 'Due date is required'),
});

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
} as const;

export default function VAManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vas, setVAs] = useState<VA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const { toast } = useToast();
  const { subscribeToTasks, unsubscribeFromTasks } = useSocket();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      assigned_to: '',
      due_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    fetchTasks();
    fetchVAs();
  }, [selectedStatus]);

  useEffect(() => {
    // Subscribe to real-time updates for tasks
    if (tasks.length > 0) {
      // We only need one subscription for all tasks
      subscribeToTasks(tasks[0].assigned_to, handleTaskUpdate);
    }

    return () => {
      if (tasks.length > 0) {
        unsubscribeFromTasks(handleTaskUpdate);
      }
    };
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        '/api/tasks' + (selectedStatus !== 'all' ? `?status=${selectedStatus}` : '')
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVAs = async () => {
    try {
      const response = await fetch('/api/vas');
      if (!response.ok) {
        throw new Error('Failed to fetch VAs');
      }
      const data = await response.json();
      setVAs(data.data);
    } catch (error) {
      console.error('Error fetching VAs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch VA list. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTaskUpdate = (update: TaskUpdate) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === update.id ? { ...task, status: update.status } : task
      )
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      toast({
        title: 'Status Updated',
        description: 'Task status has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: z.infer<typeof taskSchema>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      toast({
        title: 'Task Created',
        description: 'New task has been created successfully.',
      });

      form.reset();
      setShowNewTaskForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const metrics = {
    activeVAs: vas.length,
    pendingTasks: tasks.filter((t) => t.status === 'pending').length,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">VA Management</h2>
        <p className="text-muted-foreground">
          Manage your Virtual Assistants and track their tasks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-medium">Active VAs</h3>
          <p className="text-2xl font-bold">{metrics.activeVAs}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-medium">Pending Tasks</h3>
          <p className="text-2xl font-bold">{metrics.pendingTasks}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-medium">Completed Tasks</h3>
          <p className="text-2xl font-bold">{metrics.completedTasks}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus(status)}
                  className={
                    status !== 'all' && selectedStatus === status
                      ? statusColors[status]
                      : ''
                  }
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
            <Button onClick={() => setShowNewTaskForm(true)}>
              Assign New Task
            </Button>
          </div>

          {showNewTaskForm && (
            <Card className="p-4 border-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter task title" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter task description" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assigned_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            {...field}
                          >
                            <option value="">Select VA</option>
                            {vas.map((va) => (
                              <option key={va.id} value={va.id}>
                                {va.name} ({va.role})
                              </option>
                            ))}
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewTaskForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Task</Button>
                  </div>
                </form>
              </Form>
            </Card>
          )}

          <div className="relative">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Task</th>
                  <th className="text-left py-3 px-4">Assigned To</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Due Date</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {task.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{task.va_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[task.status]
                        }`}
                      >
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(task.due_date).toLocaleDateString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value as TaskStatus)
                        }
                        className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        {Object.keys(statusColors).map((status) => (
                          <option key={status} value={status}>
                            Move to {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {!isLoading && tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No tasks found. Create a new task to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 