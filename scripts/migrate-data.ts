const { PrismaClient } = require('@prisma/client');
const data = require('../pedite_backup.json');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando migración de datos...\n');

  // 1. Barrios
  console.log(`Insertando ${data.barrios.length} barrios...`);
  for (const b of data.barrios) {
    await prisma.barrio.upsert({
      where: { id: b.id },
      update: { name: b.name, description: b.description, active: b.active, createdAt: new Date(b.createdAt) },
      create: { id: b.id, name: b.name, description: b.description, active: b.active, createdAt: new Date(b.createdAt) },
    });
  }

  // 2. Categorías
  console.log(`Insertando ${data.categorias.length} categorías...`);
  for (const c of data.categorias) {
    await prisma.categoria.upsert({
      where: { id: c.id },
      update: { name: c.name, description: c.description, icon: c.icon, active: c.active },
      create: { id: c.id, name: c.name, description: c.description, icon: c.icon, active: c.active, createdAt: new Date(c.createdAt) },
    });
  }

  // 3. Users (sin passwords por seguridad, se regeneran)
  console.log(`Insertando ${data.users.length} usuarios...`);
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        email: u.email, fullName: u.fullName, phone: u.phone, dni: u.dni,
        role: u.role, status: u.status, barrioId: u.barrioId, lotNumber: u.lotNumber,
      },
      create: {
        id: u.id, email: u.email, password: u.password || '', fullName: u.fullName,
        phone: u.phone, dni: u.dni, role: u.role, status: u.status,
        barrioId: u.barrioId, lotNumber: u.lotNumber,
        emailVerified: u.emailVerified ? new Date(u.emailVerified) : null,
        createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt),
      },
    });
  }

  // 4. Emprendedores
  console.log(`Insertando ${data.emprendedores.length} emprendedores...`);
  for (const e of data.emprendedores) {
    await prisma.emprendedor.upsert({
      where: { id: e.id },
      update: {
        businessName: e.businessName, description: e.description, categoriaId: e.categoriaId,
        horarios: e.horarios, acceptsCash: e.acceptsCash, bankAlias: e.bankAlias,
        bankCbu: e.bankCbu, mercadoPagoLink: e.mercadoPagoLink,
        deliveryMethod: e.deliveryMethod, address: e.address, loteNumber: e.loteNumber,
        residenceBarrioId: e.residenceBarrioId, active: e.active,
        subscriptionStatus: e.subscriptionStatus, monthlyFee: e.monthlyFee,
      },
      create: {
        id: e.id, userId: e.userId, businessName: e.businessName,
        description: e.description, categoriaId: e.categoriaId,
        horarios: e.horarios, acceptsCash: e.acceptsCash,
        bankAlias: e.bankAlias, bankCbu: e.bankCbu,
        mercadoPagoLink: e.mercadoPagoLink,
        deliveryMethod: e.deliveryMethod, address: e.address,
        loteNumber: e.loteNumber, residenceBarrioId: e.residenceBarrioId,
        active: e.active, subscriptionStatus: e.subscriptionStatus,
        monthlyFee: e.monthlyFee, registrationProofUrl: e.registrationProofUrl,
        registrationProofKey: e.registrationProofKey,
        tipo: e.tipo || 'VECINO', plan: e.plan || null,
        createdAt: new Date(e.createdAt), updatedAt: new Date(e.updatedAt),
      },
    });
  }

  // 5. EmprendedorBarrios
  console.log(`Insertando ${data.emprendedorBarrios.length} emprendedorBarrios...`);
  for (const eb of data.emprendedorBarrios) {
    await prisma.emprendedorBarrio.upsert({
      where: { emprendedorId_barrioId: { emprendedorId: eb.emprendedorId, barrioId: eb.barrioId } },
      update: {},
      create: { id: eb.id, emprendedorId: eb.emprendedorId, barrioId: eb.barrioId },
    });
  }

  // 6. Productos
  console.log(`Insertando ${data.productos.length} productos...`);
  for (const p of data.productos) {
    await prisma.producto.upsert({
      where: { id: p.id },
      update: {
        name: p.name, description: p.description, price: p.price,
        imageUrl: p.imageUrl, imageKey: p.imageKey, isPublicImage: p.isPublicImage,
        emprendedorId: p.emprendedorId, categoriaId: p.categoriaId, available: p.available,
      },
      create: {
        id: p.id, name: p.name, description: p.description, price: p.price,
        imageUrl: p.imageUrl, imageKey: p.imageKey, isPublicImage: p.isPublicImage,
        emprendedorId: p.emprendedorId, categoriaId: p.categoriaId, available: p.available,
        createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt),
      },
    });
  }

  // 7. PaymentRecords
  console.log(`Insertando ${data.paymentRecords.length} paymentRecords...`);
  for (const pr of data.paymentRecords) {
    await prisma.paymentRecord.upsert({
      where: { emprendedorId_periodMonth_periodYear: { emprendedorId: pr.emprendedorId, periodMonth: pr.periodMonth, periodYear: pr.periodYear } },
      update: { amount: pr.amount, proofUrl: pr.proofUrl, notes: pr.notes, recordedBy: pr.recordedBy },
      create: {
        id: pr.id, emprendedorId: pr.emprendedorId, amount: pr.amount,
        periodMonth: pr.periodMonth, periodYear: pr.periodYear,
        proofUrl: pr.proofUrl, proofKey: pr.proofKey, notes: pr.notes,
        recordedBy: pr.recordedBy, createdAt: new Date(pr.createdAt),
      },
    });
  }

  // 8. SystemSettings
  console.log(`Insertando ${data.systemSettings.length} systemSettings...`);
  for (const s of data.systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { id: s.id, key: s.key, value: s.value, updatedAt: new Date(s.updatedAt) },
    });
  }

  console.log('\nMigración completada.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
