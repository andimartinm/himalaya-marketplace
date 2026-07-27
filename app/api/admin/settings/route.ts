export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const DEFAULT_SETTINGS = {
  payment_alias: 'himalaya.pilar.mp',
  payment_cbu: '0000003100099999999991',
  payment_titular: 'Himalaya Agency SRL',
  monthly_fee: '15000',
  mercadopago_link: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=e6a32acba9b04696910bc7a357a744bb',
  whatsapp_number: '5491168477708',
};

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany();
    
    // Create default settings if they don't exist
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    // Merge with defaults
    const result = { ...DEFAULT_SETTINGS, ...settingsMap };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Update each setting
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await prisma.systemSettings.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    const settings = await prisma.systemSettings.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...settingsMap });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
