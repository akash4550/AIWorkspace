import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: any;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-blue-100 text-blue-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-800 p-4 rounded-md shadow-sm border border-gray-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-gray-500 font-mono">{task.project?.key}-{task.id.slice(0, 4)}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2">
        {task.title}
      </h4>
      <div className="flex justify-between items-center mt-auto">
        <div className="flex -space-x-1">
          {task.assignee ? (
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-800">
              {task.assignee.firstName[0]}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-xs text-gray-400">
              ?
            </div>
          )}
        </div>
        {task._count?.subtasks > 0 && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {task._count.subtasks}
          </span>
        )}
      </div>
    </div>
  );
};
