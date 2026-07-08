export interface CreateOpportunityDto {
  leadId: string;
  stageId: string;
  expectedRevenue?: number;
  closeDate?: Date | string;
  probability?: number;
}

export interface UpdateOpportunityDto {
  leadId?: string;
  stageId?: string;
  expectedRevenue?: number;
  closeDate?: Date | string;
  probability?: number;
}

export interface OpportunityQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  stageId?: string;
  sortBy?: 'expectedRevenue' | 'createdAt' | 'closeDate';
  sortOrder?: 'asc' | 'desc';
}
