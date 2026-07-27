export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: params.id },
      include: {
        emprendedor: {
          include: {
            user: { 
              select: { 
                fullName: true, 
                phone: true, 
                email: true,
                barrioId: true,
                lotNumber: true,
                barrio: { select: { name: true } }
              } 
            },
            categoria: true,
            barrios: { include: { barrio: true } },
          },
        },
        categoria: true,
      },
    });

    // Add tipo and logoUrl to the response
    if (producto && producto.emprendedor) {
      (producto.emprendedor as any).tipo = producto.emprendedor.tipo;
      (producto.emprendedor as any).logoUrl = producto.emprendedor.logoUrl;
    }

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const relatedProducts = await prisma.producto.findMany({
      where: {
        emprendedorId: producto.emprendedorId,
        id: { not: producto.id },
        available: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        categoria: { select: { name: true } }
      },
      take: 6,
    });

    return NextResponse.json({ ...producto, relatedProducts });
  } catch (error) {
    console.error('Error fetching producto:', error);
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const producto = await prisma.producto.findUnique({ where: { id: params.id } });

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && producto.emprendedorId !== user.emprendedorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { name, description, price, categoriaId, imageUrl, imageKey, imageUrl2, imageKey2, imageUrl3, imageKey3, isPublicImage, available, images } = await request.json();

    // Filter empty image URLs
    const filteredImages = images?.filter((url: string) => url && url.trim()) || null;

    const updated = await prisma.producto.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        categoriaId,
        imageUrl,
        imageKey,
        imageUrl2: imageUrl2 || null,
        imageKey2: imageKey2 || null,
        imageUrl3: imageUrl3 || null,
        imageKey3: imageKey3 || null,
        images: filteredImages?.length ? filteredImages : null,
        isPublicImage,
        available,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating producto:', error);
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const producto = await prisma.producto.findUnique({ where: { id: params.id } });

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && producto.emprendedorId !== user.emprendedorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.producto.update({
      where: { id: params.id },
      data: { available: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting producto:', error);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
