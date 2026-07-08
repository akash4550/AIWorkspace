import { CRMActivityType } from '@prisma/client';

export interface CreateCRMActivityDto {
  type: CRMActivityType;
  content: string;
  clientId?: string;
  leadId?: string;
  opportunityId?: string;
}

export interface CRMActivityQueryDto {
  page?: number;
  limit?: number;
  clientId?: string;
  leadId?: string;
  opportunityId?: string;
}
