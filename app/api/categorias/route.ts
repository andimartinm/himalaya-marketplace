export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Error fetching categorias:', error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { name, description, icon } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    const categoria = await prisma.categoria.create({
      data: { name, description, icon },
    });

    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Error creating categoria:', error);
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}
