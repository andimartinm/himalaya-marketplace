import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { usages: true } } }
  });
  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { code, discountPercent, maxUsesPerUser, active, startDate, endDate } = await req.json();
  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) return NextResponse.json({ error: 'El cupón ya existe' }, { status: 400 });

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(), discountPercent: Number(discountPercent), maxUsesPerUser: Number(maxUsesPerUser),
      active, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null
    }
  });
  return NextResponse.json(coupon);
}
