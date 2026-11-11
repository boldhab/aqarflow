import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export interface StoredFileResult {
  url: string;
  storageKey: string;
}

export interface IStorageService {
  uploadFile(file: StorageFile, directory?: string): Promise<StoredFileResult>;
  deleteFile(storageKey: string): Promise<void>;
  getFileUrl(storageKey: string): string;
}

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor(baseDir: string = path.resolve(process.cwd(), 'uploads')) {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadFile(file: StorageFile, directory: string = 'properties'): Promise<StoredFileResult> {
    const targetDir = path.join(this.baseDir, directory);
    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    const ext = this.getExtension(file.originalname, file.mimetype);
    const randomName = `${crypto.randomUUID()}${ext}`;
    const storageKey = directory ? `${directory}/${randomName}` : randomName;
    const filePath = path.join(this.baseDir, storageKey);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      url: `/uploads/${storageKey}`,
      storageKey,
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      // Normalize to prevent directory traversal
      const safeKey = storageKey.replace(/^(\/uploads\/|\/)/, '');
      const filePath = path.join(this.baseDir, safeKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.warn(`Failed to delete local file for key ${storageKey}:`, err);
    }
  }

  getFileUrl(storageKey: string): string {
    const safeKey = storageKey.replace(/^(\/uploads\/|\/)/, '');
    return `/uploads/${safeKey}`;
  }

  private getExtension(originalname: string, mimetype: string): string {
    if (mimetype === 'image/jpeg') return '.jpg';
    if (mimetype === 'image/png') return '.png';
    if (mimetype === 'image/webp') return '.webp';

    const ext = path.extname(originalname);
    return ext || '.jpg';
  }
}

export const storageService = new LocalStorageService();
