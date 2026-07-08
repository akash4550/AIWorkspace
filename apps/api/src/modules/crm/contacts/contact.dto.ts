export interface CreateContactDto {
  clientId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation?: string;
}

export interface UpdateContactDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  designation?: string;
}

export interface ContactQueryDto {
  page?: number;
  limit?: number;
  clientId?: string;
  search?: string;
  sortBy?: 'firstName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
