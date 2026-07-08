import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
});

export const renameDocumentSchema = z.object({
  fileName: z.string().min(1).max(255),
});

export const moveDocumentSchema = z.object({
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
});
