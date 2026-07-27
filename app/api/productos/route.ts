export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barrioId = searchParams.get('barrioId');
    const categoriaId = searchParams.get('categoriaId');
    const emprendedorId = searchParams.get('emprendedorId');
    const search = searchParams.get('search');
    const includeEmpresas = searchParams.get('includeEmpresas') === 'true';

    const whereClause: any = { available: true };

    if (categoriaId) {
      whereClause.categoriaId = categoriaId;
    }

    if (emprendedorId) {
      whereClause.emprendedorId = emprendedorId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build emprendedor filter (solo estado/aprobación; no filtramos por tipo para no ocultar empresas)
    const emprendedorFilter: any = {
      active: true,
      user: { status: 'APROBADO' },
    };

    if (barrioId) {
      // Filtrar por barrio: ya sea en la tabla de barrios operativos (EmprendedorBarrio)
      // o en el barrio de residencia del emprendedor
      emprendedorFilter.OR = [
        { barrios: { some: { barrioId } } },
        { residenceBarrioId: barrioId },
      ];
    }

    whereClause.emprendedor = emprendedorFilter;

    const productos = await prisma.producto.findMany({
      where: whereClause,
      include: {
        emprendedor: {
          include: {
            user: { select: { fullName: true, phone: true, barrioId: true, lotNumber: true, barrio: { select: { name: true } } } },
            categoria: true,
          },
        },
        categoria: true,
      },
    });

    // Shuffle products randomly to give equal visibility
    const shuffledProductos = productos.sort(() => Math.random() - 0.5);

    return NextResponse.json(shuffledProductos);
  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'EMPRENDEDOR' || !user.emprendedorId) {
      return NextResponse.json({ error: 'Solo emprendedores pueden crear productos' }, { status: 403 });
    }

    // Verificar límite de productos para el emprendedor
    const emprendedor = await prisma.emprendedor.findUnique({
      where: { id: user.emprendedorId },
      select: { limiteProductos: true, tipo: true, _count: { select: { productos: true } } },
    });

    if (emprendedor?.limiteProductos && emprendedor._count.productos >= emprendedor.limiteProductos) {
      return NextResponse.json({ 
        error: `Has alcanzado el límite de ${emprendedor.limiteProductos} productos de tu plan` 
      }, { status: 403 });
    }

    const { name, description, price, categoriaId, imageUrl, imageKey, imageUrl2, imageKey2, imageUrl3, imageKey3, isPublicImage, images } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nombre y precio son requeridos' }, { status: 400 });
    }

    // Filter empty image URLs
    const filteredImages = images?.filter((url: string) => url && url.trim()) || null;

    const producto = await prisma.producto.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoriaId,
        imageUrl,
        imageKey,
        imageUrl2: imageUrl2 || null,
        imageKey2: imageKey2 || null,
        imageUrl3: imageUrl3 || null,
        imageKey3: imageKey3 || null,
        images: filteredImages?.length ? filteredImages : null,
        isPublicImage: isPublicImage ?? true,
        emprendedorId: user.emprendedorId,
      },
    });

    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error creating producto:', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
