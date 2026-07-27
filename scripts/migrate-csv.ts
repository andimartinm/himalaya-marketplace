import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const CSV_DIR = '/Users/andres/Downloads/website y apps/himalaya_marketplace/ddbb pedite';

function parseCSV(filePath: string): Record<string, string>[] {
  const raw = readFileSync(filePath, 'utf-8');
  const rows: string[][] = [];
  let current: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (inQuotes && raw[i + 1] === '"') { currentField += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      current.push(currentField);
      currentField = '';
    } else if (c === '\n' && !inQuotes) {
      current.push(currentField);
      currentField = '';
      if (current.length > 1 && current.some(f => f.trim())) rows.push(current);
      current = [];
    } else {
      currentField += c;
    }
  }
  current.push(currentField);
  if (current.length > 1 && current.some(f => f.trim())) rows.push(current);

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(values => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h] = values[i] ?? '');
    return obj;
  });
}

function toDate(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function toFloat(s: string): number | undefined {
  if (!s) return undefined;
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

function toInt(s: string): number | undefined {
  if (!s) return undefined;
  const n = parseInt(s);
  return isNaN(n) ? undefined : n;
}

function toBool(s: string): boolean {
  return s === 'true' || s === '1';
}

async function main() {
  console.log('=== Migración completa desde CSVs de Abacus ===\n');

  // 1. Barrios
  const barrios = parseCSV(join(CSV_DIR, 'barrio - data (1).csv'));
  console.log(`Barrios: ${barrios.length}`);
  for (const b of barrios) {
    await prisma.barrio.upsert({
      where: { id: b.id },
      update: { name: b.name, description: b.description || null, active: toBool(b.active) },
      create: {
        id: b.id, name: b.name, description: b.description || null,
        active: toBool(b.active), createdAt: toDate(b.createdAt) || new Date(),
      },
    });
  }

  // 2. Categorías
  const categorias = parseCSV(join(CSV_DIR, 'categoria - data (1).csv'));
  console.log(`Categorías: ${categorias.length}`);
  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { id: c.id },
      update: { name: c.name, description: c.description || null, icon: c.icon || null, active: toBool(c.active) },
      create: {
        id: c.id, name: c.name, description: c.description || null,
        icon: c.icon || null, active: toBool(c.active), createdAt: toDate(c.createdAt) || new Date(),
      },
    });
  }

  // 3. Users - deduplicate by email (keep first occurrence)
  const usersRaw = parseCSV(join(CSV_DIR, 'user - data (1).csv'));
  const seenEmails = new Set<string>();
  const users = usersRaw.filter(u => {
    if (!u.email || seenEmails.has(u.email)) return false;
    seenEmails.add(u.email);
    return true;
  });
  console.log(`Users: ${users.length} (${usersRaw.length - users.length} duplicados omitidos)`);
  const userIdMap = new Map<string, string>(); // csvId -> actualDbId
  const validUserIds = new Set<string>();
  for (const u of users) {
    try {
      const existingByEmail = await prisma.user.findUnique({ where: { email: u.email }, select: { id: true } });
      if (existingByEmail && existingByEmail.id !== u.id) {
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            fullName: u.fullName, phone: u.phone || null,
            dni: u.dni || null, role: u.role as any, status: u.status as any,
            barrioId: u.barrioId || null, lotNumber: u.lotNumber || null,
            password: u.password || undefined,
          },
        });
        userIdMap.set(u.id, existingByEmail.id);
        validUserIds.add(existingByEmail.id);
        continue;
      }
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          email: u.email, fullName: u.fullName, phone: u.phone || null,
          dni: u.dni || null, role: u.role as any, status: u.status as any,
          barrioId: u.barrioId || null, lotNumber: u.lotNumber || null,
        },
        create: {
          id: u.id, email: u.email, password: u.password || '',
          fullName: u.fullName, phone: u.phone || null, dni: u.dni || null,
          role: u.role as any, status: u.status as any,
          barrioId: u.barrioId || null, lotNumber: u.lotNumber || null,
          emailVerified: toDate(u.emailVerified),
          createdAt: toDate(u.createdAt) || new Date(),
          updatedAt: toDate(u.updatedAt) || new Date(),
        },
      });
    } catch (e: any) { console.log(`  Skip user ${u.email}: ${e.message?.substring(0, 80)}`); }
  }

  // Add all user IDs to validUserIds
  for (const u of users) validUserIds.add(userIdMap.get(u.id) || u.id);
  for (const [old, mapped] of userIdMap) validUserIds.add(mapped);

  // Helper to resolve mapped userId
  const resolveUserId = (csvId: string) => userIdMap.get(csvId) || csvId;

  // 4. Accounts - skip if userId not valid
  const accounts = parseCSV(join(CSV_DIR, 'account - data (2).csv'));
  console.log(`Accounts: ${accounts.length}`);
  for (const a of accounts) {
    const resolvedUserId = resolveUserId(a.userId);
    if (!validUserIds.has(resolvedUserId)) continue;
    try {
      await prisma.account.upsert({
        where: { id: a.id },
        update: {},
        create: {
          id: a.id, userId: resolvedUserId, type: a.type, provider: a.provider,
          providerAccountId: a.providerAccountId,
          refresh_token: a.refresh_token || null, access_token: a.access_token || null,
          expires_at: toInt(a.expires_at), token_type: a.token_type || null,
          scope: a.scope || null, id_token: a.id_token || null,
          session_state: a.session_state || null,
        },
      });
    } catch (e: any) { /* skip duplicate provider/providerAccountId */ }
  }

  // 5. Emprendedores - skip if userId not in valid users
  const emprendedores = parseCSV(join(CSV_DIR, 'emprendedor - data (1).csv'));
  const validEmprendedorIds = new Set<string>();
  console.log(`Emprendedores: ${emprendedores.length}`);
  for (const e of emprendedores) {
    const resolvedUserId = resolveUserId(e.userId);
    if (!validUserIds.has(resolvedUserId) && !validUserIds.has(e.userId)) {
      console.log(`  Skip emprendedor ${e.businessName}: userId ${e.userId} not in users`);
      continue;
    }
    const effectiveUserId = validUserIds.has(resolvedUserId) ? resolvedUserId : e.userId;
    try {
      await prisma.emprendedor.upsert({
        where: { id: e.id },
        update: {
          businessName: e.businessName, description: e.description || null,
          categoriaId: e.categoriaId || null, horarios: e.horarios || null,
          acceptsCash: toBool(e.acceptsCash), bankAlias: e.bankAlias || null,
          bankCbu: e.bankCbu || null, mercadoPagoLink: e.mercadoPagoLink || null,
          deliveryMethod: (e.deliveryMethod || 'ENTREGA_PROPIA') as any,
          address: e.address || null, loteNumber: e.loteNumber || null,
          residenceBarrioId: e.residenceBarrioId || null, active: toBool(e.active),
          subscriptionStatus: (e.subscriptionStatus || 'PENDIENTE_PAGO') as any,
          monthlyFee: toFloat(e.monthlyFee) || 15000,
          tipo: (e.tipo || 'VECINO') as any,
          plan: e.plan || null,
          limiteProductos: toInt(e.limiteProductos),
          direccionComercial: e.direccionComercial || null,
          zona: e.zona || null,
          logoUrl: e.logoUrl || null, logoKey: e.logoKey || null,
          bannerUrl: e.bannerUrl || null, bannerKey: e.bannerKey || null,
          razonSocial: e.razonSocial || null,
          registrationProofUrl: e.registrationProofUrl || null,
          registrationProofKey: e.registrationProofKey || null,
          subscriptionExpiry: toDate(e.subscriptionExpiry),
        },
        create: {
          id: e.id, userId: effectiveUserId, businessName: e.businessName,
          description: e.description || null, categoriaId: e.categoriaId || null,
          horarios: e.horarios || null, acceptsCash: toBool(e.acceptsCash),
          bankAlias: e.bankAlias || null, bankCbu: e.bankCbu || null,
          mercadoPagoLink: e.mercadoPagoLink || null,
          deliveryMethod: (e.deliveryMethod || 'ENTREGA_PROPIA') as any,
          address: e.address || null, loteNumber: e.loteNumber || null,
          residenceBarrioId: e.residenceBarrioId || null, active: toBool(e.active),
          subscriptionStatus: (e.subscriptionStatus || 'PENDIENTE_PAGO') as any,
          monthlyFee: toFloat(e.monthlyFee) || 15000,
          tipo: (e.tipo || 'VECINO') as any, plan: e.plan || null,
          limiteProductos: toInt(e.limiteProductos),
          direccionComercial: e.direccionComercial || null, zona: e.zona || null,
          logoUrl: e.logoUrl || null, logoKey: e.logoKey || null,
          bannerUrl: e.bannerUrl || null, bannerKey: e.bannerKey || null,
          razonSocial: e.razonSocial || null,
          registrationProofUrl: e.registrationProofUrl || null,
          registrationProofKey: e.registrationProofKey || null,
          subscriptionExpiry: toDate(e.subscriptionExpiry),
          createdAt: toDate(e.createdAt) || new Date(),
          updatedAt: toDate(e.updatedAt) || new Date(),
        },
      });
      validEmprendedorIds.add(e.id);
    } catch (e: any) { console.log(`  Skip emprendedor ${e.id}: ${e.message}`); }
  }

  // 6. EmprendedorBarrios - skip if emprendedor not valid
  const ebs = parseCSV(join(CSV_DIR, 'emprendedorbarrio - data (1).csv'));
  console.log(`EmprendedorBarrios: ${ebs.length}`);
  for (const eb of ebs) {
    if (!validEmprendedorIds.has(eb.emprendedorId)) continue;
    try {
      await prisma.emprendedorBarrio.upsert({
        where: { emprendedorId_barrioId: { emprendedorId: eb.emprendedorId, barrioId: eb.barrioId } },
        update: {},
        create: { id: eb.id, emprendedorId: eb.emprendedorId, barrioId: eb.barrioId },
      });
    } catch (e: any) { /* skip */ }
  }

  // 7. Productos - skip if emprendedor not valid
  const productos = parseCSV(join(CSV_DIR, 'producto - data (1).csv'));
  const validProductoIds = new Set<string>();
  console.log(`Productos: ${productos.length}`);
  for (const p of productos) {
    if (!validEmprendedorIds.has(p.emprendedorId)) {
      console.log(`  Skip producto ${p.name}: emprendedorId ${p.emprendedorId} not valid`);
      continue;
    }
    try {
      await prisma.producto.upsert({
        where: { id: p.id },
        update: {
          name: p.name, description: p.description || null, price: toFloat(p.price) || 0,
          imageUrl: p.imageUrl || null, imageKey: p.imageKey || null,
          imageUrl2: p.imageUrl2 || null, imageKey2: p.imageKey2 || null,
          imageUrl3: p.imageUrl3 || null, imageKey3: p.imageKey3 || null,
          isPublicImage: toBool(p.isPublicImage),
          emprendedorId: p.emprendedorId, categoriaId: p.categoriaId || null,
          available: toBool(p.available),
        },
        create: {
          id: p.id, name: p.name, description: p.description || null,
          price: toFloat(p.price) || 0,
          imageUrl: p.imageUrl || null, imageKey: p.imageKey || null,
          imageUrl2: p.imageUrl2 || null, imageKey2: p.imageKey2 || null,
          imageUrl3: p.imageUrl3 || null, imageKey3: p.imageKey3 || null,
          isPublicImage: toBool(p.isPublicImage),
          emprendedorId: p.emprendedorId, categoriaId: p.categoriaId || null,
          available: toBool(p.available),
          createdAt: toDate(p.createdAt) || new Date(),
          updatedAt: toDate(p.updatedAt) || new Date(),
        },
      });
      validProductoIds.add(p.id);
    } catch (e: any) { console.log(`  Skip producto ${p.id}: ${e.message}`); }
  }

  // 8. Coupons
  const coupons = parseCSV(join(CSV_DIR, 'coupon - data (1).csv'));
  console.log(`Coupons: ${coupons.length}`);
  for (const c of coupons) {
    try {
      await prisma.coupon.upsert({
        where: { id: c.id },
        update: {
          code: c.code, discountPercent: toFloat(c.discountPercent) || 30,
          maxUsesPerUser: toInt(c.maxUsesPerUser) || 3, active: toBool(c.active),
          endDate: toDate(c.endDate),
        },
        create: {
          id: c.id, code: c.code, discountPercent: toFloat(c.discountPercent) || 30,
          maxUsesPerUser: toInt(c.maxUsesPerUser) || 3, active: toBool(c.active),
          startDate: toDate(c.startDate) || new Date(),
          endDate: toDate(c.endDate),
          createdAt: toDate(c.createdAt) || new Date(),
          updatedAt: toDate(c.updatedAt) || new Date(),
        },
      });
    } catch (e: any) { /* skip */ }
  }

  // 9. Pedidos - skip if user or emprendedor not valid
  const pedidos = parseCSV(join(CSV_DIR, 'pedido - data (1).csv'));
  const validPedidoIds = new Set<string>();
  console.log(`Pedidos: ${pedidos.length}`);
  for (const p of pedidos) {
    const resolvedUserId = resolveUserId(p.userId);
    if (!validUserIds.has(resolvedUserId) || !validEmprendedorIds.has(p.emprendedorId)) continue;
    try {
      await prisma.pedido.upsert({
        where: { id: p.id },
        update: {
          status: (p.status || 'PENDIENTE') as any,
          deliveryAddress: p.deliveryAddress || null,
          notes: p.notes || null, total: toFloat(p.total) || 0,
          paymentMethod: p.paymentMethod as any || null,
          paymentProofUrl: p.paymentProofUrl || null,
          paymentProofKey: p.paymentProofKey || null,
          discount: toFloat(p.discount),
          couponId: p.couponId || null,
        },
        create: {
          id: p.id, userId: resolvedUserId, emprendedorId: p.emprendedorId,
          status: (p.status || 'PENDIENTE') as any,
          deliveryMethod: (p.deliveryMethod || 'ENTREGA_PROPIA') as any,
          deliveryAddress: p.deliveryAddress || null,
          notes: p.notes || null, total: toFloat(p.total) || 0,
          paymentMethod: p.paymentMethod as any || null,
          paymentProofUrl: p.paymentProofUrl || null,
          paymentProofKey: p.paymentProofKey || null,
          discount: toFloat(p.discount),
          couponId: p.couponId || null,
          createdAt: toDate(p.createdAt) || new Date(),
          updatedAt: toDate(p.updatedAt) || new Date(),
        },
      });
      validPedidoIds.add(p.id);
    } catch (e: any) { console.log(`  Skip pedido ${p.id}: ${e.message}`); }
  }

  // 10. PedidoItems - skip if pedido or producto not valid
  const items = parseCSV(join(CSV_DIR, 'pedidoitem - data (1).csv'));
  console.log(`PedidoItems: ${items.length}`);
  for (const i of items) {
    if (!validPedidoIds.has(i.pedidoId) || !validProductoIds.has(i.productoId)) continue;
    try {
      await prisma.pedidoItem.upsert({
        where: { id: i.id },
        update: {},
        create: {
          id: i.id, pedidoId: i.pedidoId, productoId: i.productoId,
          quantity: toInt(i.quantity) || 1,
          unitPrice: toFloat(i.unitPrice) || 0,
          subtotal: toFloat(i.subtotal) || 0,
        },
      });
    } catch (e: any) { console.log(`  Skip pedidoItem ${i.id}: ${e.message}`); }
  }

  // 11. PaymentRecords - skip if emprendedor not valid
  const payments = parseCSV(join(CSV_DIR, 'paymentrecord - data (1).csv'));
  console.log(`PaymentRecords: ${payments.length}`);
  for (const p of payments) {
    if (!validEmprendedorIds.has(p.emprendedorId)) continue;
    try {
      await prisma.paymentRecord.upsert({
        where: { emprendedorId_periodMonth_periodYear: {
          emprendedorId: p.emprendedorId, periodMonth: toInt(p.periodMonth) || 1,
          periodYear: toInt(p.periodYear) || 2026,
        }},
        update: { amount: toFloat(p.amount) || 0, notes: p.notes || null, recordedBy: p.recordedBy || null },
        create: {
          id: p.id, emprendedorId: p.emprendedorId, amount: toFloat(p.amount) || 0,
          periodMonth: toInt(p.periodMonth) || 1, periodYear: toInt(p.periodYear) || 2026,
          proofUrl: p.proofUrl || null, proofKey: p.proofKey || null,
          notes: p.notes || null, recordedBy: p.recordedBy || null,
          createdAt: toDate(p.createdAt) || new Date(),
        },
      });
    } catch (e: any) { console.log(`  Skip payment ${p.id}: ${e.message}`); }
  }

  // 12. SystemSettings
  const settings = parseCSV(join(CSV_DIR, 'systemsettings - data (1).csv'));
  console.log(`SystemSettings: ${settings.length}`);
  for (const s of settings) {
    await prisma.systemSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { id: s.id, key: s.key, value: s.value, updatedAt: toDate(s.updatedAt) || new Date() },
    });
  }

  console.log('\n=== Migración completada ===');
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
