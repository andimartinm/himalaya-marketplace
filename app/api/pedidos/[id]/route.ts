export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { fullName: true, phone: true, email: true, barrio: true, lotNumber: true } },
        emprendedor: {
          include: { user: { select: { fullName: true, phone: true } } },
        },
        items: { include: { producto: true } },
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Error fetching pedido:', error);
    return NextResponse.json({ error: 'Error al obtener pedido' }, { status: 500 });
  }
}

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  EN_PREPARACION: 'En preparación',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  RECIBIDO: 'Recibido',
};

async function sendOrderStatusEmail(pedido: any, newStatus: string) {
  try {
    const statusLabel = statusLabels[newStatus] || newStatus;
    const emprendedorName = pedido.emprendedor?.businessName || pedido.emprendedor?.user?.fullName || 'Emprendedor';
    const userEmail = pedido.user?.email;
    
    if (!userEmail) {
      console.log('No user email found, skipping notification');
      return;
    }

    const itemsHtml = pedido.items?.map((item: any) => 
      `<tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.quantity}x ${item.producto?.name}</td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.unitPrice * item.quantity).toLocaleString('es-AR')}</td></tr>`
    ).join('') || '';

    const logoUrl = 'https://pedite.shop/logo-pedite-email.png';

    // Status emoji and colors
    const statusStyles: Record<string, { emoji: string; bgColor: string; textColor: string }> = {
      PENDIENTE: { emoji: '⏳', bgColor: '#fef3c7', textColor: '#92400e' },
      CONFIRMADO: { emoji: '✅', bgColor: '#dbeafe', textColor: '#1e40af' },
      EN_PREPARACION: { emoji: '👨‍🍳', bgColor: '#f3e8ff', textColor: '#7c3aed' },
      ENTREGADO: { emoji: '🚚', bgColor: '#d1fae5', textColor: '#065f46' },
      CANCELADO: { emoji: '❌', bgColor: '#fee2e2', textColor: '#991b1b' },
      RECIBIDO: { emoji: '🎉', bgColor: '#ccfbf1', textColor: '#0d9488' },
    };
    const style = statusStyles[newStatus] || statusStyles.PENDIENTE;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <img src="${logoUrl}" alt="Pedite" style="height: 50px; width: auto;" />
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Pilar del Este</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <div style="background: ${style.bgColor}; border-left: 4px solid ${style.textColor}; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 25px;">
            <h2 style="color: ${style.textColor}; margin: 0; font-size: 20px;">${style.emoji} Tu pedido está: ${statusLabel}</h2>
            <p style="color: #666; margin: 10px 0 0 0;">Pedido de <strong>${emprendedorName}</strong></p>
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
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 25px;">
            Si tenés consultas, contactá directamente al emprendedor desde la app.
          </p>
          
          <div style="text-align: center;">
            <a href="https://pedite.shop/mis-pedidos" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Ver mis pedidos</a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Este email fue enviado desde <a href="https://pedite.shop" style="color: #0d9488; text-decoration: none;">pedite.shop</a></p>
        </div>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Tu pedido está: ${statusLabel} - Pedite`,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Error sending order status email:', error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const { status } = await request.json();

    const pedido = await prisma.pedido.findUnique({ 
      where: { id: params.id },
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        emprendedor: {
          include: { user: { select: { fullName: true } } },
        },
        items: { include: { producto: true } },
      },
    });
    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (user.role === 'EMPRENDEDOR' && pedido.emprendedorId !== user.emprendedorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const previousStatus = pedido.status;

    const updated = await prisma.pedido.update({
      where: { id: params.id },
      data: { status },
      include: {
        items: { include: { producto: true } },
      },
    });

    // Send email notification if status changed
    if (previousStatus !== status) {
      await sendOrderStatusEmail(pedido, status);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating pedido:', error);
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}