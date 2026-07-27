import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const emprendedor = await prisma.emprendedor.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        businessName: true,
        deliveryMethods: true,
        acceptsCash: true,
        bankAlias: true,
        bankCbu: true,
        mercadoPagoLink: true,
        user: {
          select: {
            phone: true,
            fullName: true,
          },
        },
      },
    });

    if (!emprendedor) {
      return NextResponse.json({ error: 'Emprendedor no encontrado' }, { status: 404 });
    }

    // Parse delivery methods
    let deliveryMethodsList: string[] = [];
    if (emprendedor.deliveryMethods) {
      try {
        deliveryMethodsList = JSON.parse(emprendedor.deliveryMethods);
      } catch {
        deliveryMethodsList = ['ENTREGA_PROPIA'];
      }
    } else {
      deliveryMethodsList = ['ENTREGA_PROPIA'];
    }

    return NextResponse.json({
      ...emprendedor,
      deliveryMethodsList,
    });
  } catch (error) {
    console.error('Error fetching emprendedor:', error);
    return NextResponse.json({ error: 'Error al obtener emprendedor' }, { status: 500 });
  }
}
