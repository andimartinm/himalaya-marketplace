export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// GET all payments or payments for a specific emprendedor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emprendedorId = searchParams.get('emprendedorId');

    const whereClause = emprendedorId ? { emprendedorId } : {};

    const payments = await prisma.paymentRecord.findMany({
      where: whereClause,
      include: {
        emprendedor: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}

// POST create a new payment record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { emprendedorId, amount, periodMonth, periodYear, proofUrl, proofKey, notes } = body;

    if (!emprendedorId || !amount || !periodMonth || !periodYear) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Check if payment already exists for this period
    const existingPayment = await prisma.paymentRecord.findUnique({
      where: {
        emprendedorId_periodMonth_periodYear: {
          emprendedorId,
          periodMonth: parseInt(periodMonth),
          periodYear: parseInt(periodYear),
        },
      },
    });

    if (existingPayment) {
      return NextResponse.json({ error: 'Ya existe un pago para este período' }, { status: 400 });
    }

    const payment = await prisma.paymentRecord.create({
      data: {
        emprendedorId,
        amount: parseFloat(amount),
        periodMonth: parseInt(periodMonth),
        periodYear: parseInt(periodYear),
        proofUrl,
        proofKey,
        notes,
        recordedBy: (session.user as any)?.email || 'admin',
      },
    });

    // Update emprendedor subscription status
    await prisma.emprendedor.update({
      where: { id: emprendedorId },
      data: {
        subscriptionStatus: 'ACTIVO',
        subscriptionExpiry: new Date(periodYear, periodMonth, 0), // Last day of the month
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
  }
}
