export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  try {
    const barrios = await prisma.barrio.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(barrios);
  } catch (error) {
    console.error('Error fetching barrios:', error);
    return NextResponse.json({ error: 'Error al obtener barrios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    const barrio = await prisma.barrio.create({
      data: { name, description },
    });

    return NextResponse.json(barrio);
  } catch (error) {
    console.error('Error creating barrio:', error);
    return NextResponse.json({ error: 'Error al crear barrio' }, { status: 500 });
  }
}
