import { Request } from 'express';

import { Role } from '@prisma/client';

import { prisma } from '../../config/prisma';

export const canUpdateTask = async (req: Request): Promise<boolean> => {
  const taskId = String(req.params.id);
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId: req.user!.organizationId,
      deletedAt: null,
    },
    select: {
      assigneeId: true,
      reporterId: true,
    },
  });

  if (!task) {
    return false;
  }

  const { id, role } = req.user!;

  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) {
    return true;
  }

  return (
    task.assigneeId === id ||
    task.reporterId === id
  );
};