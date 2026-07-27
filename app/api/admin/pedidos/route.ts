export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const pedidos = await prisma.pedido.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            barrio: { select: { name: true } },
            lotNumber: true,
          },
        },
        emprendedor: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: { phone: true },
            },
          },
        },
        items: {
          include: {
            producto: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Error fetching all pedidos:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}
