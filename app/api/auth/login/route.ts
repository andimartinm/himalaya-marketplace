export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { emprendedor: true, barrio: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    if (user.status === 'PENDIENTE') {
      return NextResponse.json({ error: 'Tu cuenta está pendiente de aprobación' }, { status: 403 });
    }

    if (user.status === 'RECHAZADO') {
      return NextResponse.json({ error: 'Tu cuenta fue rechazada' }, { status: 403 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      status: user.status,
      barrioId: user.barrioId,
      emprendedorId: user.emprendedor?.id,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
