export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generatePresignedUploadUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    // Permitir sin sesión para registro de empresa (logo y comprobante)
    const session = await getServerSession(authOptions);
    if (!session) {
      // Solo permitir upload público (logo/comprobante de registro)
      const body = await request.json();
      const { fileName, contentType, isPublic } = body;
      if (!fileName || !contentType) {
        return NextResponse.json({ error: 'fileName y contentType son requeridos' }, { status: 400 });
      }
      if (isPublic !== true) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      const { uploadUrl, cloud_storage_path, publicUrl } = await generatePresignedUploadUrl(
        fileName,
        contentType,
        true
      );
      return NextResponse.json({ uploadUrl, cloud_storage_path, publicUrl });
    }

    const { fileName, contentType, isPublic } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName y contentType son requeridos' }, { status: 400 });
    }

    const { uploadUrl, cloud_storage_path, publicUrl } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic ?? true
    );

    return NextResponse.json({ uploadUrl, cloud_storage_path, publicUrl });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Error al generar URL de subida' }, { status: 500 });
  }
}
