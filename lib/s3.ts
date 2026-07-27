import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<{ uploadUrl: string; cloud_storage_path: string; publicUrl: string }> {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Mock local para desarrollo
  if (process.env.NODE_ENV === 'development' && process.env.AWS_PROFILE === 'local') {
    const localName = `${timestamp}-${safeName}`;
    const publicUrl = `/uploads/${localName}`;
    const cloud_storage_path = `uploads/${localName}`;
    const uploadUrl = `http://localhost:3000/api/upload/local-mock?path=${encodeURIComponent(cloud_storage_path)}`;
    return { uploadUrl, cloud_storage_path, publicUrl };
  }

  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME no está configurado. Revisá tu .env');
  }

  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${timestamp}-${safeName}`
    : `${folderPrefix}uploads/${timestamp}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  // Generar URL pública
  const region = process.env.AWS_REGION ?? 'us-east-1';
  const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;

  return { uploadUrl, cloud_storage_path, publicUrl };
}

export async function getFileUrl(cloud_storage_path: string, isPublic: boolean): Promise<string> {
  if (isPublic) {
    const region = process.env.AWS_REGION ?? 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: 'attachment',
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteFile(cloud_storage_path: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  await s3Client.send(command);
}
