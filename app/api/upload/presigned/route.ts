export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (!session && isPublic !== true) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = isPublic
      ? `public/uploads/${timestamp}-${safeName}`
      : `uploads/${timestamp}-${safeName}`;

    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      cloud_storage_path: blob.pathname,
      publicUrl: blob.url,
    });
  } catch (error) {
    console.error('Error uploading:', error);
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
