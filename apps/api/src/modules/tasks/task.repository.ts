import { PrismaClient, Prisma } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskQueryDto } from './task.dto';

const prisma = new PrismaClient();

export class TaskRepository {
    async findById(organizationId: string, id: string) {
        return prisma.task.findFirst({
            where: { id, organizationId, deletedAt: null },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                reporter: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                project: { select: { id: true, name: true, key: true } },
                subtasks: { where: { deletedAt: null } }
            }
        });
    }

    async findMany(organizationId: string, query: TaskQueryDto) {
        const { 
            page = 1, limit = 50, search, projectId, assigneeId, 
            status, priority, isArchived, sortBy = 'position', sortOrder = 'asc' 
        } = query;
        
        const skip = (page - 1) * limit;

        const where: Prisma.TaskWhereInput = {
            organizationId,
            deletedAt: null,
            archived: isArchived || false,
            parentTaskId: null // By default, only fetch top-level tasks for the board
        };

        if (projectId) where.projectId = projectId;
        if (assigneeId) where.assigneeId = assigneeId;
        if (status) where.status = status;
        if (priority) where.priority = priority;

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const orderBy: Prisma.TaskOrderByWithRelationInput = {};
        orderBy[sortBy] = sortOrder;

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    project: { select: { id: true, name: true, key: true } },
                    _count: { select: { subtasks: true } }
                }
            }),
            prisma.task.count({ where })
        ]);

        return {
            data: tasks,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    async findMaxPosition(organizationId: string, projectId: string, status: string): Promise<number> {
        const task = await prisma.task.findFirst({
            where: { organizationId, projectId, status: status as any, deletedAt: null },
            orderBy: { position: 'desc' },
            select: { position: true }
        });
        return task?.position || 0;
    }

    async create(organizationId: string, reporterId: string, data: CreateTaskDto) {
        // Calculate position if not provided (append to end of column)
        let position = data.position;
        if (position === undefined) {
            const maxPos = await this.findMaxPosition(organizationId, data.projectId, data.status || 'TODO');
            position = Math.ceil(maxPos) + 65536; // Large gap for fractional indexing
        }

        return prisma.task.create({
            data: {
                organizationId,
                reporterId,
                projectId: data.projectId,
                parentTaskId: data.parentTaskId,
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId,
                dueDate: data.dueDate,
                estimatedHours: data.estimatedHours,
                position,
            }
        });
    }

    async update(organizationId: string, id: string, data: UpdateTaskDto) {
        return prisma.task.update({
            where: { id_organizationId: { id, organizationId } } as any, // In prisma, id is unique globally, but we enforce org check
            data,
        }).catch(() => {
            // Fallback for safe org update
            return prisma.task.updateMany({
                where: { id, organizationId },
                data
            }).then(() => this.findById(organizationId, id));
        });
    }

    async safeUpdate(organizationId: string, id: string, data: Partial<Prisma.TaskUpdateInput>) {
        const task = await prisma.task.findFirst({ where: { id, organizationId }});
        if (!task) return null;
        return prisma.task.update({ where: { id }, data });
    }

    async softDelete(organizationId: string, id: string) {
        return this.safeUpdate(organizationId, id, { deletedAt: new Date() });
    }
}
