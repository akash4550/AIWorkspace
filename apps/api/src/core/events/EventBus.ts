import { EventEmitter } from 'events';

// Core Domain Events
export type DomainEvent =
  | 'TaskCreated'
  | 'TaskUpdated'
  | 'TaskAssigned'
  | 'ProjectCreated'
  | 'ProjectUpdated'
  | 'TeamMemberInvited'
  | 'UserJoinedTeam'
  | 'DocumentUploaded'
  | 'ClientCreated'
  | 'ClientUpdated'
  | 'ClientDeleted'
  | 'ContactCreated'
  | 'ContactUpdated'
  | 'ContactDeleted'
  | 'LeadCreated'
  | 'LeadUpdated'
  | 'LeadDeleted'
  | 'OpportunityCreated'
  | 'OpportunityUpdated'
  | 'OpportunityDeleted'
  | 'PipelineStageCreated'
  | 'PipelineStageUpdated'
  | 'PipelineStageDeleted'
  | 'PipelineStagesReordered'
  | 'CRMActivityLogged';

export interface EventPayload {
  organizationId: string;
  [key: string]: any;
}

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners to prevent memory leak warnings as the app grows
    this.setMaxListeners(50);
  }

  emitEvent(eventName: DomainEvent, payload: EventPayload) {
    // In a real microservices architecture, this could publish to Kafka or Redis Pub/Sub
    // For our modular monolith, an in-memory emitter is sufficient and fast
    this.emit(eventName, payload);
    return true;
  }

  onEvent(eventName: DomainEvent, listener: (payload: EventPayload) => void) {
    this.on(eventName, listener);
  }
}

// Export singleton instance
export const eventBus = new EventBus();
