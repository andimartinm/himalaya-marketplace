import { del } from '@vercel/blob';

export async function deleteFile(cloud_storage_path: string): Promise<void> {
  await del(cloud_storage_path);
}
