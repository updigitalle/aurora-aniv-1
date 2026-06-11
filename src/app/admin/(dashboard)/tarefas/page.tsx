import React from 'react';
import { db } from '@/lib/db';
import TaskListClient from './TaskListClient';

export const revalidate = 30;

export default async function TarefasPage() {
  let tasks = [] as Awaited<ReturnType<typeof db.task.findMany>>;
  try {
    tasks = await db.task.findMany({
      orderBy: [
        { completed: 'asc' },
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Tarefas] DB error:', msg);
  }

  // Custom sort to make sure: alta (1), media (2), baixa (3)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    const priorityWeight: Record<string, number> = { alta: 1, media: 2, baixa: 3 };
    const weightA = priorityWeight[a.priority] || 2;
    const weightB = priorityWeight[b.priority] || 2;
    return weightA - weightB;
  });

  return <TaskListClient initialTasks={sortedTasks} />;
}
