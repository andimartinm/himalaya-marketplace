export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function sendNotificationEmail(params: {
  app_id: string;
  notification_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  is_html?: boolean;
  sender_alias?: string;
}) {
  try {
    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        ...params,
      }),
    });
    const result = await response.json();
    if (!result.success && !result.notification_disabled) {
      console.error('Failed to send welcome email:', result.message);
    }
    return result.success;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      fullName, 
      phone, 
      dni, 
      barrioId, 
      lotNumber,
      userType,
      businessName,
      description,
      categoriaId,
      horarios,
      acceptsCash,
      bankAlias,
      bankCbu,
      mercadoPagoLink,
      deliveryMethod,
      address,
      barrioIds,
      residenceBarrioId,
      loteNumber: emprendedorLoteNumber,
      registrationProofUrl,
      registrationProofKey,
      isExistingUser,
      // Campos para empresas
      tipo,
      plan,
      limiteProductos,
      direccionComercial,
      zona,
      logoUrl,
      logoKey,
      razonSocial,
      monthlyFee: customMonthlyFee,
    } = body;

    // For existing users registering as emprendedor, password is optional
    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email y nombre son requeridos' },
        { status: 400 }
      );
    }

    if (!isExistingUser && !password) {
      return NextResponse.json(
        { error: 'La contraseña es requerida' },
        { status: 400 }
      );
    }

    // Validate barrioId exists if provided
    let validBarrioId: string | null = null;
    if (barrioId && barrioId.trim() !== '') {
      const barrio = await prisma.barrio.findUnique({ where: { id: barrioId } });
      if (barrio) {
        validBarrioId = barrioId;
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    // Handle existing user upgrading to emprendedor
    if (isExistingUser && userType === 'EMPRENDEDOR') {
      if (!existingUser) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Check if already an emprendedor
      const existingEmprendedor = await prisma.emprendedor.findUnique({ 
        where: { userId: existingUser.id } 
      });
      if (existingEmprendedor) {
        return NextResponse.json(
          { error: 'Ya sos emprendedor' },
          { status: 400 }
        );
      }

      if (!businessName) {
        return NextResponse.json(
          { error: 'El nombre del negocio es requerido' },
          { status: 400 }
        );
      }

      // Update user role to EMPRENDEDOR and update any new info
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'EMPRENDEDOR',
          status: 'PENDIENTE',
          fullName: fullName || existingUser.fullName,
          phone: phone || existingUser.phone,
          dni: dni || existingUser.dni,
        },
      });

      // Create emprendedor profile
      const emprendedor = await prisma.emprendedor.create({
        data: {
          userId: existingUser.id,
          businessName,
          description: description || null,
          categoriaId: categoriaId || null,
          horarios: horarios || null,
          acceptsCash: acceptsCash !== false,
          bankAlias: bankAlias || null,
          bankCbu: bankCbu || null,
          mercadoPagoLink: mercadoPagoLink || null,
          deliveryMethod: deliveryMethod || 'ENTREGA_PROPIA',
          address: address || null,
          residenceBarrioId: residenceBarrioId || null,
          loteNumber: emprendedorLoteNumber || null,
          subscriptionStatus: 'PENDIENTE_PAGO',
          monthlyFee: 15000,
          registrationProofUrl: registrationProofUrl || null,
          registrationProofKey: registrationProofKey || null,
        },
      });

      if (barrioIds && Array.isArray(barrioIds) && barrioIds.length > 0) {
        await prisma.emprendedorBarrio.createMany({
          data: barrioIds.map((bid: string) => ({
            emprendedorId: emprendedor.id,
            barrioId: bid,
          })),
        });
      }

      return NextResponse.json({
        message: 'Registro como emprendedor exitoso. Tu cuenta está pendiente de aprobación.',
        userId: existingUser.id,
        emprendedorId: emprendedor.id,
      });
    }

    // New user registration
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (userType === 'EMPRESA') {
      // Registro de empresa externa
      if (!businessName) {
        return NextResponse.json(
          { error: 'El nombre comercial es requerido' },
          { status: 400 }
        );
      }

      if (!direccionComercial || !zona) {
        return NextResponse.json(
          { error: 'La dirección y zona son requeridas' },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phone: phone || null,
          dni: dni || null,
          role: 'EMPRENDEDOR',
          status: 'PENDIENTE',
        },
      });

      const emprendedor = await prisma.emprendedor.create({
        data: {
          userId: user.id,
          businessName,
          description: description || null,
          categoriaId: categoriaId || null,
          horarios: horarios || null,
          acceptsCash: acceptsCash !== false,
          bankAlias: bankAlias || null,
          bankCbu: bankCbu || null,
          mercadoPagoLink: mercadoPagoLink || null,
          deliveryMethod: 'ENTREGA_PROPIA',
          subscriptionStatus: 'PENDIENTE_PAGO',
          monthlyFee: customMonthlyFee || 55000,
          registrationProofUrl: registrationProofUrl || null,
          registrationProofKey: registrationProofKey || null,
          // Campos específicos de empresa
          tipo: 'EMPRESA',
          plan: plan || 'PROFESIONAL',
          limiteProductos: limiteProductos || 50,
          direccionComercial: direccionComercial || null,
          zona: zona || null,
          logoUrl: logoUrl || null,
          logoKey: logoKey || null,
          razonSocial: razonSocial || null,
        },
      });

      return NextResponse.json({
        message: 'Registro de empresa exitoso. Tu cuenta está pendiente de aprobación.',
        userId: user.id,
        emprendedorId: emprendedor.id,
      });
    } else if (userType === 'EMPRENDEDOR') {
      if (!businessName) {
        return NextResponse.json(
          { error: 'El nombre del negocio es requerido' },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phone: phone || null,
          dni: dni || null,
          role: 'EMPRENDEDOR',
          status: 'PENDIENTE',
          barrioId: validBarrioId,
        },
      });

      const emprendedor = await prisma.emprendedor.create({
        data: {
          userId: user.id,
          businessName,
          description: description || null,
          categoriaId: categoriaId || null,
          horarios: horarios || null,
          acceptsCash: acceptsCash !== false,
          bankAlias: bankAlias || null,
          bankCbu: bankCbu || null,
          mercadoPagoLink: mercadoPagoLink || null,
          deliveryMethod: deliveryMethod || 'ENTREGA_PROPIA',
          address: address || null,
          residenceBarrioId: residenceBarrioId || null,
          loteNumber: emprendedorLoteNumber || null,
          subscriptionStatus: 'PENDIENTE_PAGO',
          monthlyFee: 15000,
          registrationProofUrl: registrationProofUrl || null,
          registrationProofKey: registrationProofKey || null,
          tipo: 'VECINO',
        },
      });

      if (barrioIds && Array.isArray(barrioIds) && barrioIds.length > 0) {
        await prisma.emprendedorBarrio.createMany({
          data: barrioIds.map((bid: string) => ({
            emprendedorId: emprendedor.id,
            barrioId: bid,
          })),
        });
      }

      return NextResponse.json({
        message: 'Registro exitoso. Tu cuenta está pendiente de aprobación.',
        userId: user.id,
        emprendedorId: emprendedor.id,
      });
    } else {
      // Vecinos are automatically approved
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phone: phone || null,
          dni: dni || null,
          role: 'VECINO',
          status: 'APROBADO',
          barrioId: validBarrioId,
          lotNumber: lotNumber || null,
        },
      });

      // Send welcome email
      const welcomeEmailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://pedite.shop/logo-pedite-oficial.png" alt="Pedite" style="height: 60px;" />
          </div>
          <h1 style="color: #0d9488; text-align: center;">¡Tu cuenta fue activada!</h1>
          <p style="font-size: 16px; color: #374151;">Hola <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; color: #374151;">
            Tu cuenta ya está activa y lista para usar. Ahora podés explorar todos los productos y servicios 
            de tu barrio.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://pedite.shop/catalogo" 
               style="background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Explorar catálogo
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #374151; margin-bottom: 15px;">
              <strong>Seguinos en Instagram</strong><br />
              <a href="https://www.instagram.com/pedite.shop" style="color: #0d9488; text-decoration: none;">@pedite.shop</a>
            </p>
            <p style="font-size: 14px; color: #374151;">
              <strong>Soporte y feedback</strong><br />
              <a href="https://wa.me/5491171508355" style="color: #0d9488; text-decoration: none;">WhatsApp: +54 9 11 7150-8355</a>
            </p>
          </div>
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            © 2026 Pedite - Tu marketplace de barrio
          </p>
        </div>
      `;

      await sendNotificationEmail({
        app_id: process.env.WEB_APP_ID || '',
        notification_id: process.env.NOTIF_ID_BIENVENIDA_VECINO || '',
        recipient_email: email,
        subject: '¡Bienvenido/a a Pedite! 🎉',
        body: welcomeEmailBody,
        is_html: true,
        sender_alias: 'Pedite',
      });

      return NextResponse.json({
        message: 'Registro exitoso. ¡Ya podés comenzar a comprar!',
        userId: user.id,
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
