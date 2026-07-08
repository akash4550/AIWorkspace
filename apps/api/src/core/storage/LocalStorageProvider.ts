import fs from 'fs';
import path from 'path';
import { IStorageProvider, UploadResult } from './IStorageProvider';
import { v4 as uuidv4 } from 'uuid';

export class LocalStorageProvider implements IStorageProvider {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, pathPrefix: string): Promise<UploadResult> {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const storageKey = path.join(pathPrefix, fileName);
    
    const targetDir = path.join(this.baseUploadDir, pathPrefix);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, fileName);
    
    // In a real app with Multer, file.path exists if we used diskStorage.
    // If we used memoryStorage, we write file.buffer.
    if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, targetPath);
      fs.unlinkSync(file.path); // cleanup temp
    } else {
        throw new Error('No file buffer or path provided by multer');
    }

    // For local dev, URL could just route back to our Express static server
    const url = `/uploads/${storageKey.replace(/\\/g, '/')}`;

    return {
      key: storageKey,
      url,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const targetPath = path.join(this.baseUploadDir, key);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      return true;
    } catch (e) {
      console.error('Failed to delete file', e);
      return false;
    }
  }

  async getFileUrl(key: string): Promise<string> {
    return `/uploads/${key.replace(/\\/g, '/')}`;
  }

  getProviderName(): string {
    return 'local';
  }
}
