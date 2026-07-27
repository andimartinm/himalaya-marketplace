export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (role) whereClause.role = role;

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        barrio: true,
        emprendedor: { 
          include: { 
            categoria: true,
            barrios: {
              include: { barrio: true }
            },
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        pedidos: {
          select: {
            id: true,
            total: true,
            status: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats for each user
    const usersWithStats = await Promise.all(users.map(async (u) => {
      let stats = {
        totalPedidos: 0,
        totalGastado: 0,
        totalGenerado: 0,
      };

      if (u.role === 'VECINO') {
        // Vecino stats: orders made and money spent
        stats.totalPedidos = u.pedidos.length;
        stats.totalGastado = u.pedidos
          .filter(p => p.status !== 'CANCELADO')
          .reduce((sum, p) => sum + p.total, 0);
      }

      if (u.role === 'EMPRENDEDOR' && u.emprendedor) {
        // Emprendedor stats: orders received and money generated
        const emprendedorPedidos = await prisma.pedido.findMany({
          where: { emprendedorId: u.emprendedor.id },
          select: { total: true, status: true },
        });
        stats.totalPedidos = emprendedorPedidos.length;
        stats.totalGenerado = emprendedorPedidos
          .filter(p => p.status !== 'CANCELADO')
          .reduce((sum, p) => sum + p.total, 0);
      }

      return { 
        ...u, 
        password: undefined,
        stats,
        emprendedor: u.emprendedor ? {
          ...u.emprendedor,
          subscriptionStatus: u.emprendedor.subscriptionStatus,
          subscriptionExpiry: u.emprendedor.subscriptionExpiry,
          monthlyFee: u.emprendedor.monthlyFee,
          registrationProofUrl: u.emprendedor.registrationProofUrl,
          barrios: u.emprendedor.barrios.map(b => b.barrio),
          lastPayment: u.emprendedor.payments[0] || null,
          tipo: u.emprendedor.tipo,
          plan: u.emprendedor.plan,
          zona: u.emprendedor.zona,
        } : null,
      };
    }));

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}
