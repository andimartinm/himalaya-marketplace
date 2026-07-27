export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET single empresa with productos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresa = await prisma.emprendedor.findFirst({
      where: {
        id: params.id,
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
        bannerUrl: true,
        direccionComercial: true,
        zona: true,
        horarios: true,
        acceptsCash: true,
        bankAlias: true,
        mercadoPagoLink: true,
        tipo: true,
        user: {
          select: {
            phone: true,
          },
        },
        categoria: {
          select: {
            id: true,
            name: true,
          },
        },
        productos: {
          where: {
            available: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            available: true,
            categoria: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!empresa) {
      return NextResponse.json({ error: 'Comercio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Error fetching comercio:', error);
    return NextResponse.json({ error: 'Error al obtener comercio' }, { status: 500 });
  }
}
