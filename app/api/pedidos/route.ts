export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let whereClause: any = {};

    if (user.role === 'VECINO') {
      whereClause.userId = user.id;
    } else if (user.role === 'EMPRENDEDOR') {
      whereClause.emprendedorId = user.emprendedorId;
    }

    if (status) {
      whereClause.status = status;
    }

    const pedidos = await prisma.pedido.findMany({
      where: whereClause,
      include: {
        user: { select: { fullName: true, phone: true, email: true, barrio: true, lotNumber: true } },
        emprendedor: {
          include: { user: { select: { fullName: true, phone: true } } },
        },
        items: {
          include: { producto: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Error fetching pedidos:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

async function sendNewOrderEmail(pedido: any, buyerName: string, buyerPhone: string, buyerBarrio: string, buyerLote: string) {
  try {
    // Get emprendedor email
    const emprendedor = await prisma.emprendedor.findUnique({
      where: { id: pedido.emprendedorId },
      include: { user: { select: { email: true, fullName: true } } },
    });

    if (!emprendedor?.user?.email) {
      console.log('No emprendedor email found, skipping notification');
      return;
    }

    const itemsHtml = pedido.items?.map((item: any) => 
      `<tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.quantity}x ${item.producto?.name}</td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.unitPrice * item.quantity).toLocaleString('es-AR')}</td></tr>`
    ).join('') || '';

    const logoUrl = 'https://pedite.shop/logo-pedite-email.png';

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <img src="${logoUrl}" alt="Pedite" style="height: 50px; width: auto;" />
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Pilar del Este</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
            <h2 style="color: #92400e; margin: 0; font-size: 18px;">🔔 ¡Nuevo pedido recibido!</h2>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Datos del cliente</h3>
            <p style="margin: 8px 0; color: #1f2937;"><strong>👤 ${buyerName}</strong></p>
            <p style="margin: 8px 0; color: #4b5563;">📍 ${buyerBarrio}${buyerLote ? `, Lote ${buyerLote}` : ''}</p>
            ${buyerPhone ? `<p style="margin: 8px 0;"><a href="https://wa.me/549${buyerPhone.replace(/\\D/g, '').slice(-10)}" style="color: #16a34a; text-decoration: none;">📱 WhatsApp: ${buyerPhone}</a></p>` : ''}
          </div>
          
          <div style="background: #f9fafb; border-radius: 12px; overflow: hidden; margin-bottom: 25px;">
            <div style="background: #0d9488; color: white; padding: 12px 20px;">
              <h3 style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Detalle del pedido</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr style="background: #0d9488;">
                <td style="padding: 15px 20px; color: white; font-weight: bold;">Total</td>
                <td style="padding: 15px 20px; color: white; font-weight: bold; text-align: right; font-size: 18px;">$${pedido.total?.toLocaleString('es-AR')}</td>
              </tr>
            </table>
          </div>
          
          ${pedido.notes ? `
          <div style="background: #fef9c3; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0; color: #854d0e;"><strong>📝 Nota:</strong> ${pedido.notes}</p>
          </div>
          ` : ''}
          
          <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">✓ Checklist antes de entregar</h3>
            <div style="color: #1e3a8a;">
              <p style="margin: 8px 0;">💬 1. Contactar cliente por WhatsApp</p>
              <p style="margin: 8px 0;">💳 2. Confirmar pago recibido</p>
              <p style="margin: 8px 0;">✅ 3. Aceptar y preparar pedido</p>
            </div>
            <p style="margin: 15px 0 0 0; font-size: 13px; color: #3b82f6;">Entrega: <strong>A coordinar</strong></p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://pedite.shop/emprendedor/pedidos" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Ver mis pedidos</a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Este email fue enviado desde <a href="https://pedite.shop" style="color: #0d9488; text-decoration: none;">pedite.shop</a></p>
        </div>
      </div>
    `;

    await sendEmail({
      to: emprendedor.user.email,
      subject: `🛒 Nuevo pedido de ${buyerName} - $${pedido.total?.toLocaleString('es-AR')}`,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Error sending new order email:', error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'VECINO') {
      return NextResponse.json({ error: 'Solo vecinos pueden crear pedidos' }, { status: 403 });
    }

    const { items, emprendedorId, deliveryMethod, deliveryAddress, notes, paymentMethod, paymentProofUrl, paymentProofKey, couponCode } = await request.json();

    if (!items || items.length === 0 || !emprendedorId) {
      return NextResponse.json({ error: 'Items y emprendedor son requeridos' }, { status: 400 });
    }

    // Get buyer info for email
    const buyer = await prisma.user.findUnique({
      where: { id: user.id },
      include: { barrio: true },
    });

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    let total = subtotal;
    let discount = 0;
    let validCoupon: any = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.active && coupon.startDate <= new Date() && (!coupon.endDate || coupon.endDate >= new Date())) {
        const usageCount = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: user.id } });
        if (usageCount < coupon.maxUsesPerUser) {
          validCoupon = coupon;
          discount = subtotal * (coupon.discountPercent / 100);
          total = subtotal - discount;
        }
      }
    }

    const pedidoData: any = {
      userId: user.id,
      emprendedorId,
      deliveryMethod: deliveryMethod || 'ENTREGA_PROPIA',
      deliveryAddress,
      notes,
      total,
      discount: discount > 0 ? discount : undefined,
      couponId: validCoupon ? validCoupon.id : undefined,
      paymentMethod,
      paymentProofUrl,
      paymentProofKey,
      items: {
        create: items.map((item: any) => ({
          productoId: item.productoId,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
        })),
      },
    };

    if (validCoupon) {
      pedidoData.couponUsage = { create: { couponId: validCoupon.id, userId: user.id } };
    }

    const pedido = await prisma.pedido.create({
      data: pedidoData,
      include: {
        items: { include: { producto: true } },
        emprendedor: { include: { user: { select: { fullName: true, phone: true } } } },
      },
    });

    // Send email notification to emprendedor
    await sendNewOrderEmail(
      pedido,
      buyer?.fullName || 'Cliente',
      buyer?.phone || '',
      buyer?.barrio?.name || '',
      buyer?.lotNumber || ''
    );

    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Error creating pedido:', error);
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}