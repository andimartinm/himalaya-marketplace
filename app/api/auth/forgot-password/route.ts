import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' });
    }

    // Check if user registered with Google (no password)
    if (!user.password) {
      return NextResponse.json({ message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/recuperar-password/${resetToken}`;
    
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
            <h1 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: bold;">🔐 Recuperar Contraseña</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola <strong>${user.fullName}</strong>,</p>
            
            <p style="color: #666; font-size: 15px; line-height: 1.6;">Recibimos una solicitud para restablecer tu contraseña en Pedite.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #0d9488; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; border: 2px solid #0d9488;">Restablecer Contraseña</a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">Este enlace expira en <strong>1 hora</strong>.</p>
            
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin-top: 20px;">Si no solicitaste este cambio, podés ignorar este email. Tu contraseña no cambiará.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
            <p style="color: #0d9488; font-size: 11px; word-break: break-all; text-align: center;">${resetUrl}</p>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">© 2026 Pedite</p>
        </div>
      </body>
      </html>
    `;

    // Send notification email
    try {
      await sendEmail({
        to: user.email,
        subject: '🔐 Recuperá tu contraseña - Pedite',
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Error sending recovery email:', emailError);
    }

    return NextResponse.json({ message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Error procesando solicitud' }, { status: 500 });
  }
}
