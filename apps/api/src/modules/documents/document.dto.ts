export interface UploadDocumentDto {
  projectId?: string;
  taskId?: string;
}

export interface DocumentQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  projectId?: string;
  taskId?: string;
  sortBy?: 'fileName' | 'createdAt' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface RenameDocumentDto {
  fileName: string;
}

export interface MoveDocumentDto {
  projectId?: string;
  taskId?: string;
}
