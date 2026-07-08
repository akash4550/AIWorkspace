import { ClientStatus } from '@prisma/client';

export interface CreateClientDto {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownerId?: string; // Optional, defaults to creator if not specified
}

export interface UpdateClientDto {
  name?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownerId?: string;
  status?: ClientStatus;
}

export interface ClientQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClientStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
