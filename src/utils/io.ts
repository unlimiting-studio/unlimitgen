import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeBase64File(base64: string, outDir: string, prefix: string, ext: string): Promise<string> {
  await ensureDir(outDir);
  const fileName = `${prefix}-${Date.now()}.${ext}`;
  const fullPath = path.resolve(outDir, fileName);
  await fs.writeFile(fullPath, Buffer.from(base64, 'base64'));
  return fullPath;
}

export async function writeBufferFile(buf: Buffer, outDir: string, prefix: string, ext: string): Promise<string> {
  await ensureDir(outDir);
  const fileName = `${prefix}-${Date.now()}.${ext}`;
  const fullPath = path.resolve(outDir, fileName);
  await fs.writeFile(fullPath, buf);
  return fullPath;
}

export async function detectMimeTypeFromPath(filePath: string): Promise<string> {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  throw new Error(`지원하지 않는 파일 확장자입니다: ${filePath}`);
}
