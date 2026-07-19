import { eventBus, EventPayload } from '../../core/events/EventBus';
import { getIO, organizationRoom, userRoom } from './socket';

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
    const orgRoom = organizationRoom(payload.organizationId);
    io.to(orgRoom).emit('task.created', payload);
  };

  private handleTaskUpdated = (payload: EventPayload) => {
    const io = getIO();
    const orgRoom = organizationRoom(payload.organizationId);
    io.to(orgRoom).emit('task.updated', payload);
  };

  private handleTaskAssigned = (payload: EventPayload) => {
    const io = getIO();
    const orgRoom = organizationRoom(payload.organizationId);
    
    // Broadcast to org so Kanban boards update
    io.to(orgRoom).emit('task.assigned', payload);
    
    // Send direct notification to assignee if it's not the same user
    if (payload.assigneeId && payload.assigneeId !== payload.actorId) {
      const assigneeRoom = userRoom(payload.assigneeId);
      io.to(assigneeRoom).emit('notification.new', {
        title: 'New Task Assigned',
        message: `You were assigned to task: ${payload.taskTitle}`,
        link: `/tasks/${payload.taskId}`,
        createdAt: new Date()
      });
    }
  };
}
