'use client';

import React, { useState, useTransition } from 'react';
import { Task } from '@prisma/client';
import { toggleTask, deleteTask, createTask } from './actions';
import {
  CheckSquare,
  Square,
  Trash2,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  Tag,
  Filter,
  Sparkles
} from 'lucide-react';

interface TaskListClientProps {
  initialTasks: Task[];
}

const CATEGORIES = [
  'Geral',
  'Convites',
  'Comida',
  'Espaço',
  'Decoração',
  'Vestuário',
  'Serviços'
];

export default function TaskListClient({ initialTasks }: TaskListClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'concluidas'>('todos');

  // Formulário de Nova Tarefa
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newPriority, setNewPriority] = useState('media');
  const [newDueDate, setNewDueDate] = useState('');
  const [formError, setFormError] = useState('');

  // Toggles de status
  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Atualização otimista
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !currentStatus } : t))
    );

    const res = await toggleTask(id, !currentStatus);
    if (!res.success) {
      // Reverter se falhar
      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, completed: currentStatus } : t))
      );
      alert(res.error);
    }
  };

  // Remoção de tarefa
  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta tarefa?')) {
      const originalTasks = [...tasks];
      setTasks(prev => prev.filter(t => t.id !== id));

      const res = await deleteTask(id);
      if (!res.success) {
        setTasks(originalTasks);
        alert(res.error);
      }
    }
  };

  // Criação de tarefa
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('O título da tarefa é obrigatório.');
      return;
    }

    startTransition(async () => {
      const res = await createTask({
        title: newTitle,
        category: newCategory,
        priority: newPriority,
        dueDate: newDueDate || undefined,
      });

      if (res.success) {
        // Como o revalidatePath atualiza o Server Component, podemos re-atualizar as tasks localmente.
        // Mas para simplificar, limpamos o form e podemos recarregar, ou simplesmente atualizar localmente com um id temporário até o reload.
        // Para uma UX ideal, recarregamos a página ou adicionamos na lista.
        // Vamos dar um reload na página para atualizar todos os estados de forma consistente:
        window.location.reload();
      } else {
        setFormError(res.error || 'Erro ao criar tarefa.');
      }
    });
  };

  // Filtragem
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || task.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'pendentes' && !task.completed) ||
      (statusFilter === 'concluidas' && task.completed);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'alta':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-50 text-red-500 border border-red-100 uppercase">Alta</span>;
      case 'media':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-princess-gold-dark border border-princess-gold-light uppercase">Média</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-50 text-gray-500 border border-gray-200 uppercase">Baixa</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-princess-text flex items-center gap-2">
            <CheckSquare className="text-princess-rose" /> Checklist de Planejamento
          </h2>
          <p className="text-sm text-princess-text/60">Organize todas as etapas da festa por categorias</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:from-princess-pink-dark hover:to-princess-rose text-white rounded-xl font-medium shadow-md transition duration-200 text-sm"
        >
          {isAdding ? 'Fechar Formulário' : 'Nova Tarefa'}
          <Plus size={16} className={`transition-transform duration-200 ${isAdding ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Formulário de Adicionar Tarefa */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 princess-card-shadow border border-princess-pink-light/40 space-y-4 animate-in slide-in-from-top duration-200">
          <h3 className="font-serif-display font-bold text-lg text-princess-text flex items-center gap-1.5">
            <Sparkles size={16} className="text-princess-gold" /> Adicionar Nova Tarefa
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Título */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-princess-text/70 mb-1.5">Título da Tarefa</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Ex: Encomendar o bolo de aniversário..."
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/70 mb-1.5">Categoria</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/70 mb-1.5">Prioridade</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            {/* Prazo */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/70 mb-1.5">Prazo Opcional</label>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1.5">
              <AlertCircle size={14} /> {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm text-princess-text/60 hover:bg-gray-50 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm bg-princess-rose hover:bg-princess-pink-dark text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : 'Salvar Tarefa'}
            </button>
          </div>
        </form>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-princess-pink-light/40 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Busca */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-princess-rose/50">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar tarefas..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
          />
        </div>

        {/* Botões de Filtros */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Categoria */}
          <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl px-3 py-1.5 text-sm">
            <Tag size={14} className="text-princess-rose" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none font-medium text-princess-text/80 cursor-pointer"
            >
              <option value="Todos">Todas Categorias</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center bg-[#FAF9F6] border border-princess-rose/10 rounded-xl p-1 text-sm">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'todos' ? 'bg-white text-princess-rose shadow-sm' : 'text-princess-text/60 hover:text-princess-text'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('pendentes')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'pendentes' ? 'bg-white text-princess-rose shadow-sm' : 'text-princess-text/60 hover:text-princess-text'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setStatusFilter('concluidas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'concluidas' ? 'bg-white text-princess-rose shadow-sm' : 'text-princess-text/60 hover:text-princess-text'
              }`}
            >
              Concluídas
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="bg-white rounded-2xl border border-princess-pink-light/40 overflow-hidden">
        {filteredTasks.length > 0 ? (
          <div className="divide-y divide-princess-pink-light/20">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className={`p-4 flex items-center justify-between gap-4 group transition ${
                  task.completed ? 'bg-princess-pink-light/10 opacity-70' : 'hover:bg-[#FAF9F6]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(task.id, task.completed)}
                    className="mt-0.5 text-princess-rose hover:scale-105 active:scale-95 transition shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare size={20} className="fill-princess-pink-light" />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>

                  <div className="space-y-1">
                    <p className={`text-sm font-medium transition ${
                      task.completed ? 'line-through text-princess-text/40' : 'text-princess-text'
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-princess-lavender text-princess-rose/90 rounded border border-princess-lilac/30">
                        {task.category}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {task.dueDate && (
                        <span className="text-princess-text/50 flex items-center gap-1">
                          <Calendar size={12} />
                          Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-princess-text/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition duration-150 shrink-0 md:opacity-0 group-hover:opacity-100"
                  title="Excluir tarefa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-princess-text/50 space-y-2">
            <Filter size={32} className="mx-auto text-princess-rose/30" />
            <p className="text-sm font-medium">Nenhuma tarefa encontrada para os filtros selecionados.</p>
            <p className="text-xs">Tente ajustar seus termos de busca ou filtros de categoria.</p>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="text-xs text-princess-text/50 flex items-center justify-between px-2">
        <span>Total listado: {filteredTasks.length} de {tasks.length} tarefas</span>
        <span>Concluídas no total: {tasks.filter(t => t.completed).length} ({tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%)</span>
      </div>
    </div>
  );
}
