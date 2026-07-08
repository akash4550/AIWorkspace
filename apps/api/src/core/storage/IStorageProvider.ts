export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface IStorageProvider {
  uploadFile(file: Express.Multer.File, pathPrefix: string): Promise<UploadResult>;
  deleteFile(key: string): Promise<boolean>;
  getFileUrl(key: string): Promise<string>;
  getProviderName(): string;
}
