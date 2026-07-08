import { LeadStatus } from '@prisma/client';

export interface CreateLeadDto {
  title: string;
  source?: string;
  score?: number;
  assignedTo?: string;
  expectedValue?: number;
}

export interface UpdateLeadDto {
  title?: string;
  source?: string;
  score?: number;
  status?: LeadStatus;
  assignedTo?: string;
  expectedValue?: number;
}

export interface LeadQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  sortBy?: 'title' | 'createdAt' | 'score';
  sortOrder?: 'asc' | 'desc';
}
