import React from 'react';
import { db } from '@/lib/db';
import TaskListClient from './TaskListClient';

export const revalidate = 0;

export default async function TarefasPage() {
  const tasks = await db.task.findMany({
    orderBy: [
      { completed: 'asc' }, // não concluídas primeiro
      { priority: 'asc' },  // alta -> media -> baixa (se ordenado alfabeticamente: alta, baixa, media, let's just let it sort or rely on date)
      { createdAt: 'desc' },
    ],
  });

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
