'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function toggleTask(id: string, completed: boolean) {
  try {
    await db.task.update({
      where: { id },
      data: { completed },
    });
    revalidatePath('/admin/tarefas');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return { success: false, error: 'Erro ao atualizar tarefa.' };
  }
}

export async function deleteTask(id: string) {
  try {
    await db.task.delete({
      where: { id },
    });
    revalidatePath('/admin/tarefas');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    return { success: false, error: 'Erro ao deletar tarefa.' };
  }
}

export async function createTask(data: {
  title: string;
  category: string;
  priority: string;
  dueDate?: string;
}) {
  try {
    if (!data.title.trim()) {
      return { success: false, error: 'O título é obrigatório.' };
    }

    await db.task.create({
      data: {
        title: data.title.trim(),
        category: data.category || 'Geral',
        priority: data.priority || 'media',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        completed: false,
      },
    });
    revalidatePath('/admin/tarefas');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return { success: false, error: 'Erro ao criar tarefa.' };
  }
}
