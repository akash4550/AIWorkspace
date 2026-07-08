import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

const COLUMNS = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

interface KanbanBoardProps {
  tasks: any[];
}

export const KanbanBoard = ({ tasks: initialTasks }: KanbanBoardProps) => {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, status, position }: { taskId: string, status: string, position: number }) => {
      const res = await api.patch(`/tasks/${taskId}/move`, { status, position });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Moving over another task
    if (isActiveTask && isOverTask) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const overIndex = prev.findIndex(t => t.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          const newTasks = [...prev];
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: prev[overIndex].status };
          return newTasks;
        }
        return prev;
      });
    }

    // Moving to an empty column
    if (isActiveTask && isOverColumn) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        if (prev[activeIndex].status !== overId) {
          const newTasks = [...prev];
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: overId as string };
          return newTasks;
        }
        return prev;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';
    
    let newStatus = activeTask.status;
    let newPosition = activeTask.position;

    const columnTasks = tasks
      .filter(t => t.status === (isOverColumn ? overId : tasks.find(x => x.id === overId)?.status))
      .sort((a, b) => a.position - b.position);

    if (isOverColumn) {
        newStatus = overId as string;
        if (columnTasks.length === 0) {
            newPosition = 65536;
        } else {
            // Append to end of empty column logically handled by drag over
            newPosition = columnTasks[columnTasks.length - 1].position + 65536;
        }
    } else if (isOverTask) {
        const overIndex = columnTasks.findIndex(t => t.id === overId);
        const overTask = columnTasks[overIndex];
        newStatus = overTask.status;

        if (activeId !== overId) {
            // Calculate fractional position
            const activeOriginalIndex = columnTasks.findIndex(t => t.id === activeId);
            const isMovingDown = activeOriginalIndex !== -1 && activeOriginalIndex < overIndex;

            if (isMovingDown) {
                // Insert after overTask
                const nextTask = columnTasks[overIndex + 1];
                if (nextTask) {
                    newPosition = (overTask.position + nextTask.position) / 2;
                } else {
                    newPosition = overTask.position + 65536;
                }
            } else {
                // Insert before overTask
                const prevTask = columnTasks[overIndex - 1];
                if (prevTask) {
                    newPosition = (prevTask.position + overTask.position) / 2;
                } else {
                    newPosition = overTask.position / 2;
                }
            }
        }
    }

    // Optimistic UI Update
    const newTasks = tasks.map(t => {
        if (t.id === activeId) {
            return { ...t, status: newStatus, position: newPosition };
        }
        return t;
    }).sort((a, b) => a.position - b.position);
    setTasks(newTasks);

    // Persist
    moveTaskMutation.mutate({
        taskId: activeId as string,
        status: newStatus,
        position: newPosition
    });
  };

  return (
    <div className="flex h-full overflow-x-auto pb-4 gap-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position)}
          />
        ))}

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
