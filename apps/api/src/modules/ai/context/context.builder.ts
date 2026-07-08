import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ContextBuilder {
  /**
   * Safely fetches task details, ensuring it belongs to the organization.
   * Formats it into a dense string suitable for LLM injection.
   */
  static async buildTaskContext(organizationId: string, taskId: string): Promise<string> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
      include: {
        assignee: true,
        project: true,
        subtasks: true
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    return `
[TASK CONTEXT]
ID: ${task.id}
Title: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Assignee: ${task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
Project: ${task.project.name}
Description: ${task.description || 'None'}
Subtasks Count: ${task.subtasks.length}
`;
  }

  /**
   * Safely fetches project details and associated tasks.
   */
  static async buildProjectContext(organizationId: string, projectId: string): Promise<string> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        tasks: {
          select: { title: true, status: true, priority: true }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const taskSummary = project.tasks.map(t => `- [${t.status}] ${t.title} (${t.priority})`).join('\n');

    return `
[PROJECT CONTEXT]
ID: ${project.id}
Name: ${project.name}
Status: ${project.status}
Description: ${project.description || 'None'}

Tasks:
${taskSummary || 'No tasks assigned.'}
`;
  }
}
