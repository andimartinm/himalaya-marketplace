import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { code } = await req.json();
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.active) return NextResponse.json({ error: 'Cupón inválido o inactivo' }, { status: 400 });
  const now = new Date();
  if (coupon.startDate > now || (coupon.endDate && coupon.endDate < now)) return NextResponse.json({ error: 'Cupón expirado o no vigente' }, { status: 400 });

  const usageCount = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: (session.user as any).id } });
  if (usageCount >= coupon.maxUsesPerUser) return NextResponse.json({ error: 'Límite de usos alcanzado' }, { status: 400 });

  return NextResponse.json({ id: coupon.id, code: coupon.code, discountPercent: coupon.discountPercent });
}
