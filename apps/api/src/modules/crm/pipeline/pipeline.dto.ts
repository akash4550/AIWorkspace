export interface CreatePipelineStageDto {
  name: string;
  probability?: number;
  position: number;
}

export interface UpdatePipelineStageDto {
  name?: string;
  probability?: number;
  position?: number;
}

export interface ReorderStagesDto {
  stages: { id: string; position: number }[];
}
