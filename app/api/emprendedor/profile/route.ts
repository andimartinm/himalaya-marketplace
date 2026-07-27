export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'EMPRENDEDOR' || !user.emprendedorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const emprendedor = await prisma.emprendedor.findUnique({
      where: { id: user.emprendedorId },
      include: {
        user: { select: { fullName: true, phone: true, email: true, dni: true } },
        categoria: true,
        barrios: { include: { barrio: true } },
        productos: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Parse deliveryMethods from JSON string or fallback to single deliveryMethod
    let deliveryMethods: string[] = [];
    if (emprendedor?.deliveryMethods) {
      try {
        deliveryMethods = JSON.parse(emprendedor.deliveryMethods);
      } catch {
        deliveryMethods = emprendedor.deliveryMethod ? [emprendedor.deliveryMethod] : [];
      }
    } else if (emprendedor?.deliveryMethod) {
      deliveryMethods = [emprendedor.deliveryMethod];
    }

    return NextResponse.json({ ...emprendedor, deliveryMethods });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'EMPRENDEDOR' || !user.emprendedorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      businessName,
      description,
      categoriaId,
      horarios,
      acceptsCash,
      bankAlias,
      bankCbu,
      mercadoPagoLink,
      deliveryMethod,
      deliveryMethods,
      address,
      barrioIds,
      phone,
      fullName,
      logoUrl,
      logoKey,
      bannerUrl,
      bannerKey,
      direccionComercial,
      zona,
    } = body;

    // Update user personal data
    const userUpdateData: any = {};
    if (phone !== undefined) userUpdateData.phone = phone;
    if (fullName !== undefined) userUpdateData.fullName = fullName;
    
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });
    }

    // Build update data
    const updateData: any = {
      businessName,
      description,
      categoriaId,
      horarios,
      acceptsCash,
      bankAlias,
      bankCbu,
      mercadoPagoLink,
      address,
    };

    // Handle deliveryMethods array - save as JSON string
    if (deliveryMethods && Array.isArray(deliveryMethods)) {
      updateData.deliveryMethods = JSON.stringify(deliveryMethods);
      updateData.deliveryMethod = deliveryMethods[0] || null; // Keep first as primary for compatibility
    } else if (deliveryMethod) {
      updateData.deliveryMethod = deliveryMethod;
    }

    // Only update logo if provided
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (logoKey !== undefined) updateData.logoKey = logoKey;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (bannerKey !== undefined) updateData.bannerKey = bannerKey;
    if (direccionComercial !== undefined) updateData.direccionComercial = direccionComercial;
    if (zona !== undefined) updateData.zona = zona;

    const emprendedor = await prisma.emprendedor.update({
      where: { id: user.emprendedorId },
      data: updateData,
    });

    if (barrioIds && Array.isArray(barrioIds)) {
      await prisma.emprendedorBarrio.deleteMany({ where: { emprendedorId: user.emprendedorId } });
      await prisma.emprendedorBarrio.createMany({
        data: barrioIds.map((bid: string) => ({ emprendedorId: user.emprendedorId, barrioId: bid })),
      });
    }

    return NextResponse.json(emprendedor);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
