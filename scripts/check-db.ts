import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, status: true }
  });
  const emprendedores = await prisma.emprendedor.findMany({
    select: { id: true, businessName: true, userId: true }
  });
  const productos = await prisma.producto.findMany({
    select: { id: true, name: true, available: true }
  });
  const pedidos = await prisma.pedido.findMany({
    select: { id: true, status: true, total: true }
  });
  
  console.log('\n=== ESTADO ACTUAL DE LA BASE DE DATOS ===\n');
  console.log('USUARIOS (' + users.length + '):');
  users.forEach(u => console.log('  - ' + u.email + ' | ' + u.fullName + ' | ' + u.role + ' | ' + u.status));
  
  console.log('\nEMPRENDEDORES (' + emprendedores.length + '):');
  emprendedores.forEach(e => console.log('  - ' + e.businessName));
  
  console.log('\nPRODUCTOS (' + productos.length + '):');
  productos.forEach(p => console.log('  - ' + p.name + ' | disponible: ' + p.available));
  
  console.log('\nPEDIDOS (' + pedidos.length + '):');
  pedidos.forEach(p => console.log('  - ID: ' + p.id.slice(0,8) + '... | ' + p.status + ' | $' + p.total));
}

main().catch(console.error).finally(() => prisma.$disconnect());
