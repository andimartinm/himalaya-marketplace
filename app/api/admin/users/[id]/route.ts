export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        barrio: true,
        emprendedor: {
          include: {
            categoria: true,
            barrios: { include: { barrio: true } },
            payments: { orderBy: { createdAt: 'desc' } },
          },
        },
        pedidos: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ...user, password: undefined });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { status, emprendedorActive, subscriptionStatus, subscriptionExpiry } = body;

    // Get current user state before update
    const userBefore = await prisma.user.findUnique({
      where: { id: params.id },
      include: { emprendedor: true },
    });

    const wasNotApproved = userBefore?.status !== 'APROBADO';

    // Update user status if provided
    if (status) {
      await prisma.user.update({
        where: { id: params.id },
        data: { status },
      });
    }

    // Update emprendedor if needed
    if (userBefore?.emprendedor) {
      const emprendedorUpdate: any = {};
      
      if (emprendedorActive !== undefined) {
        emprendedorUpdate.active = emprendedorActive;
      }
      if (subscriptionStatus) {
        emprendedorUpdate.subscriptionStatus = subscriptionStatus;
      }
      if (subscriptionExpiry) {
        emprendedorUpdate.subscriptionExpiry = new Date(subscriptionExpiry);
      }

      if (Object.keys(emprendedorUpdate).length > 0) {
        await prisma.emprendedor.update({
          where: { id: userBefore.emprendedor.id },
          data: emprendedorUpdate,
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { barrio: true, emprendedor: true },
    });

    // Send email notification if emprendedor is being approved
    if (status === 'APROBADO' && wasNotApproved && updatedUser?.emprendedor) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
                <img src="https://pedite.shop/logo-pedite-email.png" alt="Pedite" style="height: 50px; margin-bottom: 10px;">
                <h1 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: bold;">🎉 ¡Tu cuenta fue habilitada!</h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola <strong>${updatedUser.fullName}</strong>,</p>
                
                <p style="color: #666; font-size: 15px; line-height: 1.6;">¡Excelentes noticias! Tu cuenta de emprendedor <strong>"${updatedUser.emprendedor.businessName}"</strong> ha sido aprobada y ya está activa en Pedite.</p>
                
                <p style="color: #666; font-size: 15px; line-height: 1.6;">Ya podés comenzar a subir tus productos y empezar a vender a todos los vecinos del barrio.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXTAUTH_URL}/login?email=${encodeURIComponent(updatedUser.email)}" style="background-color: #0d9488; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; border: 2px solid #0d9488;">Subir mis productos</a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
                <div style="text-align: center;">
                  <p style="color: #666; font-size: 14px; margin-bottom: 10px;"><strong>Seguinos en Instagram</strong></p>
                  <a href="https://www.instagram.com/pedite.shop" style="color: #0d9488; text-decoration: none; font-size: 14px;">@pedite.shop</a>
                </div>
                <div style="text-align: center; margin-top: 15px;">
                  <p style="color: #666; font-size: 14px; margin-bottom: 10px;"><strong>Soporte por consultas y feedback</strong></p>
                  <a href="https://wa.me/5491171508355" style="color: #0d9488; text-decoration: none; font-size: 14px;">WhatsApp: +54 9 11 7150-8355</a>
                </div>
              </div>
              
              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">© 2026 Pedite</p>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: updatedUser.email,
          subject: '🎉 ¡Tu cuenta de emprendedor fue habilitada! - Pedite',
          html: emailHtml,
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }
    }

    return NextResponse.json({ ...updatedUser, password: undefined });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = params.id;

    // Prevent deleting yourself
    if ((session.user as any)?.id === userId) {
      return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 });
    }

    // Prevent deleting other admins
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, include: { emprendedor: true } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'No se puede eliminar un administrador' }, { status: 400 });
    }

    // Delete in order to respect foreign keys
    // 1. CouponUsage (has onDelete cascade from user, but let's be explicit)
    await prisma.couponUsage.deleteMany({ where: { userId } });

    // 2. PedidoItems for user's pedidos
    const userPedidos = await prisma.pedido.findMany({ where: { userId }, select: { id: true } });
    const pedidoIds = userPedidos.map(p => p.id);
    if (pedidoIds.length > 0) {
      await prisma.pedidoItem.deleteMany({ where: { pedidoId: { in: pedidoIds } } });
      await prisma.pedido.deleteMany({ where: { userId } });
    }

    // 3. If emprendedor, delete related data
    if (targetUser.emprendedor) {
      const empId = targetUser.emprendedor.id;
      // Delete pedidos received by this emprendedor
      const empPedidos = await prisma.pedido.findMany({ where: { emprendedorId: empId }, select: { id: true } });
      const empPedidoIds = empPedidos.map(p => p.id);
      if (empPedidoIds.length > 0) {
        await prisma.couponUsage.deleteMany({ where: { pedidoId: { in: empPedidoIds } } });
        await prisma.pedidoItem.deleteMany({ where: { pedidoId: { in: empPedidoIds } } });
        await prisma.pedido.deleteMany({ where: { emprendedorId: empId } });
      }
      // Productos
      await prisma.producto.deleteMany({ where: { emprendedorId: empId } });
      // PaymentRecords
      await prisma.paymentRecord.deleteMany({ where: { emprendedorId: empId } });
      // EmprendedorBarrio
      await prisma.emprendedorBarrio.deleteMany({ where: { emprendedorId: empId } });
      // Emprendedor itself (cascades from user, but explicit)
      await prisma.emprendedor.delete({ where: { id: empId } });
    }

    // 4. Delete user (cascades accounts, sessions)
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
