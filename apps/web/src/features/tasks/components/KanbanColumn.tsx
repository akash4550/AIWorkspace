import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: string;
  tasks: any[];
}

export const KanbanColumn = ({ status, tasks }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { type: 'Column', status }
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    BACKLOG: { label: 'Backlog', color: 'bg-gray-100 dark:bg-slate-800 border-gray-200' },
    TODO: { label: 'To Do', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' },
    IN_REVIEW: { label: 'In Review', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' },
    DONE: { label: 'Done', color: 'bg-green-50 dark:bg-green-900/20 border-green-200' },
  };

  const config = statusConfig[status] || statusConfig.TODO;

  return (
    <div className={`flex flex-col flex-shrink-0 w-80 rounded-lg border dark:border-slate-700 ${config.color}`}>
      <div className="p-3 border-b dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 rounded-t-lg">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">{config.label}</h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className="flex-1 p-3 flex flex-col gap-3 min-h-[150px] overflow-y-auto"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
