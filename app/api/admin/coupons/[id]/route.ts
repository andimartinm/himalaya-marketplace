import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const coupon = await prisma.coupon.findUnique({
    where: { id: params.id },
    include: { usages: { include: { user: { select: { id: true, fullName: true, email: true } }, pedido: { select: { id: true, total: true, discount: true, createdAt: true } } }, orderBy: { createdAt: 'desc' } } }
  });
  return NextResponse.json(coupon);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const data = await req.json();
  const updateData: any = { ...data };
  if (data.code) updateData.code = data.code.toUpperCase();
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  const coupon = await prisma.coupon.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json(coupon);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  await prisma.coupon.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
