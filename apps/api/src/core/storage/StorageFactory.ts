import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';

export class StorageFactory {
  static getProvider(): IStorageProvider {
    // In a real app, this might read from config.env to determine if we use S3, Cloudinary, etc.
    return new LocalStorageProvider();
  }
}
