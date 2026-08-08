import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../env.js';

export type StoredFile = {
  /** Public path, e.g. `/uploads/ab12.pdf`. Stored in the DB. */
  url: string;
  size: number;
};

export interface FileStore {
  save(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<StoredFile>;
  remove(url: string): Promise<void>;
}

/** Writes into UPLOAD_DIR, which Next.js serves statically at /uploads/*. */
class LocalDiskStore implements FileStore {
  async save(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<StoredFile> {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const name = `${randomUUID()}${ext}`;
    await fs.mkdir(env.uploadDir, { recursive: true });
    await fs.writeFile(path.join(env.uploadDir, name), file.buffer);
    return { url: `/uploads/${name}`, size: file.buffer.byteLength };
  }

  async remove(url: string): Promise<void> {
    const name = path.basename(url);
    // Never let a stored value escape the upload directory.
    if (!url.startsWith('/uploads/') || name !== url.slice('/uploads/'.length)) return;
    await fs.rm(path.join(env.uploadDir, name), { force: true });
  }
}

export const fileStore: FileStore = new LocalDiskStore();
