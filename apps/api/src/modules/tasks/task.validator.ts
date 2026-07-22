import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

const taskIdParamsSchema = z.object({
  id: z.string().uuid('Invalid task ID')
}).strict();

export const taskIdSchema = z.object({
  params: taskIdParamsSchema
});

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().uuid('Invalid project ID'),
    parentTaskId: z.string().uuid().optional().nullable(),
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assigneeId: z.string().uuid().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    estimatedHours: z.number().min(0).optional().nullable(),
    position: z.number().optional()
  }).strict()
});

export const updateTaskSchema = z.object({
  params: taskIdParamsSchema,
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assigneeId: z.string().uuid().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    estimatedHours: z.number().min(0).optional().nullable(),
  }).strict().refine(
    (data) => Object.values(data).some(
      (value) => value !== undefined
    ),
    'At least one task field is required'
  )
});

export const moveTaskSchema = z.object({
  params: taskIdParamsSchema,
  body: z.object({
    status: z.nativeEnum(TaskStatus),
    position: z.number()
  }).strict()
});

export const assignTaskSchema = z.object({
  params: taskIdParamsSchema,
  body: z.object({
    assigneeId: z.string().uuid().nullable()
  }).strict()
});
