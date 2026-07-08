import { eventBus, EventPayload } from '../../core/events/EventBus';
import { getIO } from './socket';

export class RealtimeService {
  initializeListeners() {
    eventBus.onEvent('TaskCreated', this.handleTaskCreated);
    eventBus.onEvent('TaskUpdated', this.handleTaskUpdated);
    eventBus.onEvent('TaskAssigned', this.handleTaskAssigned);
    // Future listeners...
    console.log('Realtime Service: EventBus listeners attached');
  }

  private handleTaskCreated = (payload: EventPayload) => {
    const io = getIO();
    const orgRoom = `org_${payload.organizationId}`;
    io.to(orgRoom).emit('task.created', payload);
  };

  private handleTaskUpdated = (payload: EventPayload) => {
    const io = getIO();
    const orgRoom = `org_${payload.organizationId}`;
    io.to(orgRoom).emit('task.updated', payload);
  };

  private handleTaskAssigned = (payload: EventPayload) => {
    const io = getIO();
    const orgRoom = `org_${payload.organizationId}`;
    
    // Broadcast to org so Kanban boards update
    io.to(orgRoom).emit('task.assigned', payload);
    
    // Send direct notification to assignee if it's not the same user
    if (payload.assigneeId && payload.assigneeId !== payload.actorId) {
      const userRoom = `user_${payload.assigneeId}`;
      io.to(userRoom).emit('notification.new', {
        title: 'New Task Assigned',
        message: `You were assigned to task: ${payload.taskTitle}`,
        link: `/tasks/${payload.taskId}`,
        createdAt: new Date()
      });
    }
  };
}
