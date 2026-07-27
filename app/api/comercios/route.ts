export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all empresas (tipo = EMPRESA, activas y aprobadas)
export async function GET() {
  try {
    const empresas = await prisma.emprendedor.findMany({
      where: {
        tipo: 'EMPRESA',
        active: true,
        user: {
          status: 'APROBADO',
        },
      },
      select: {
        id: true,
        businessName: true,
        description: true,
        logoUrl: true,
        direccionComercial: true,
        zona: true,
        horarios: true,
        categoria: {
          select: {
            id: true,
            name: true,
          },
        },
        productos: {
          where: { available: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            productos: {
              where: { available: true },
            },
          },
        },
      },
      orderBy: {
        businessName: 'asc',
      },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Error fetching comercios:', error);
    return NextResponse.json({ error: 'Error al obtener comercios' }, { status: 500 });
  }
}
