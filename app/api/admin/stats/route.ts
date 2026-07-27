export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [totalUsers, pendingUsers, totalEmprendedores, pendingEmprendedores, totalPedidos, pedidosPendientes, totalBarrios, categorias, emprendedoresActivos, pedidosEntregados] = await Promise.all([
      prisma.user.count({ where: { role: 'VECINO' } }),
      prisma.user.count({ where: { role: 'VECINO', status: 'PENDIENTE' } }),
      prisma.user.count({ where: { role: 'EMPRENDEDOR' } }),
      prisma.user.count({ where: { role: 'EMPRENDEDOR', status: 'PENDIENTE' } }),
      prisma.pedido.count(),
      prisma.pedido.count({ where: { status: 'PENDIENTE' } }),
      prisma.barrio.count({ where: { active: true } }),
      prisma.categoria.findMany({
        where: { active: true },
        include: { _count: { select: { productos: true } } },
      }),
      prisma.emprendedor.count({ where: { subscriptionStatus: 'ACTIVO' } }),
      prisma.pedido.findMany({ where: { status: 'ENTREGADO' }, select: { total: true } }),
    ]);

    // Calcular totales de ventas y licencias
    const totalVentas = pedidosEntregados.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalLicencias = emprendedoresActivos * 15000;

    const pedidosByStatus = await prisma.pedido.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const pedidosByCategoria = await prisma.pedido.findMany({
      include: {
        emprendedor: { include: { categoria: true } },
      },
    });

    const categoriaStats = categorias.map(cat => {
      const pedidosCount = pedidosByCategoria.filter(
        p => p.emprendedor?.categoriaId === cat.id
      ).length;
      return {
        name: cat.name,
        productos: cat._count.productos,
        pedidos: pedidosCount,
      };
    });

    return NextResponse.json({
      totalUsers,
      pendingUsers,
      totalEmprendedores,
      pendingEmprendedores,
      totalPedidos,
      pedidosPendientes,
      totalBarrios,
      totalVentas,
      totalLicencias,
      emprendedoresActivos,
      pedidosByStatus: pedidosByStatus.map(p => ({ status: p.status, count: p._count.status })),
      categoriaStats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
