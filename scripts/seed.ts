import { PrismaClient, UserRole, UserStatus, DeliveryMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.pedidoItem.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.emprendedorBarrio.deleteMany();
  await prisma.emprendedor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.barrio.deleteMany();

  // Create Barrios
  const barrios = await Promise.all([
    prisma.barrio.create({ data: { name: 'Santa Elena', description: 'Barrio residencial con amplios espacios verdes' } }),
    prisma.barrio.create({ data: { name: 'San Eduardo', description: 'Barrio familiar con excelente ubicación' } }),
    prisma.barrio.create({ data: { name: 'San Alfonso', description: 'Barrio tranquilo ideal para familias' } }),
    prisma.barrio.create({ data: { name: 'San Ramón', description: 'Barrio con acceso a lagos y áreas recreativas' } }),
    prisma.barrio.create({ data: { name: 'Santa Guadalupe', description: 'Barrio nuevo con infraestructura moderna' } }),
  ]);

  console.log('Created barrios:', barrios.length);

  // Create Categorias
  const categorias = await Promise.all([
    prisma.categoria.create({ data: { name: 'Comidas', description: 'Viandas, comida casera, pastelería', icon: 'utensils' } }),
    prisma.categoria.create({ data: { name: 'Productos', description: 'Artesanías, plantas, productos varios', icon: 'package' } }),
    prisma.categoria.create({ data: { name: 'Servicios', description: 'Pileta, jardinería, yoga, electricista', icon: 'wrench' } }),
  ]);

  console.log('Created categorias:', categorias.length);

  // Create Admin User
  const adminPassword = await bcrypt.hash('himalaya2024!', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@himalaya.com',
      password: adminPassword,
      fullName: 'Administrador Himalaya',
      role: UserRole.ADMIN,
      status: UserStatus.APROBADO,
    },
  });

  // Create test user (required)
  const testPassword = await bcrypt.hash('johndoe123', 10);
  await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: testPassword,
      fullName: 'John Doe',
      role: UserRole.ADMIN,
      status: UserStatus.APROBADO,
    },
  });

  console.log('Created admin users');

  // Create sample Vecino (approved)
  const vecinoPassword = await bcrypt.hash('vecino123', 10);
  const vecino = await prisma.user.create({
    data: {
      email: 'maria@email.com',
      password: vecinoPassword,
      fullName: 'María García',
      phone: '1156789012',
      dni: '30456789',
      role: UserRole.VECINO,
      status: UserStatus.APROBADO,
      barrioId: barrios[0].id,
      lotNumber: '145',
    },
  });

  // Create pending vecino
  await prisma.user.create({
    data: {
      email: 'pending@email.com',
      password: vecinoPassword,
      fullName: 'Juan Pendiente',
      phone: '1198765432',
      dni: '28765432',
      role: UserRole.VECINO,
      status: UserStatus.PENDIENTE,
      barrioId: barrios[1].id,
      lotNumber: '201',
    },
  });

  console.log('Created vecinos');

  // Create Emprendedor 1 - Comidas
  const emp1Password = await bcrypt.hash('emprendedor123', 10);
  const emp1User = await prisma.user.create({
    data: {
      email: 'cocina.laura@email.com',
      password: emp1Password,
      fullName: 'Laura Martínez',
      phone: '1145678901',
      dni: '29876543',
      role: UserRole.EMPRENDEDOR,
      status: UserStatus.APROBADO,
      barrioId: barrios[0].id,
    },
  });

  const emprendedor1 = await prisma.emprendedor.create({
    data: {
      userId: emp1User.id,
      businessName: 'Cocina de Laura',
      description: 'Viandas caseras y pastelería artesanal. Todo hecho con ingredientes frescos y mucho amor.',
      categoriaId: categorias[0].id,
      horarios: 'Lunes a Viernes 9:00 - 18:00',
      acceptsCash: true,
      bankAlias: 'cocina.laura.mp',
      mercadoPagoLink: 'https://link.mercadopago.com.ar/lauracocina',
      deliveryMethod: DeliveryMethod.ENTREGA_PROPIA,
      address: 'Santa Elena, Lote 87',
    },
  });

  // Link emprendedor1 to barrios
  await prisma.emprendedorBarrio.createMany({
    data: [
      { emprendedorId: emprendedor1.id, barrioId: barrios[0].id },
      { emprendedorId: emprendedor1.id, barrioId: barrios[1].id },
      { emprendedorId: emprendedor1.id, barrioId: barrios[2].id },
    ],
  });

  // Create productos for emprendedor1
  await prisma.producto.createMany({
    data: [
      {
        name: 'Vianda de Milanesas con Puré',
        description: 'Milanesas de carne caseras con puré de papa cremoso',
        price: 4500,
        emprendedorId: emprendedor1.id,
        categoriaId: categorias[0].id,
        imageUrl: 'https://images.unsplash.com/photo-1619221882220-947b3d3c8861?w=400',
      },
      {
        name: 'Tarta de Verduras',
        description: 'Tarta casera de espinaca, zapallito y queso',
        price: 3800,
        emprendedorId: emprendedor1.id,
        categoriaId: categorias[0].id,
        imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
      },
      {
        name: 'Torta de Chocolate',
        description: 'Torta húmeda de chocolate con ganache',
        price: 8500,
        emprendedorId: emprendedor1.id,
        categoriaId: categorias[0].id,
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
      },
      {
        name: 'Empanadas (docena)',
        description: 'Empanadas de carne cortada a cuchillo',
        price: 6000,
        emprendedorId: emprendedor1.id,
        categoriaId: categorias[0].id,
        imageUrl: 'https://images.unsplash.com/photo-1615996001375-c7ef13294436?w=400',
      },
    ],
  });

  // Create Emprendedor 2 - Productos
  const emp2User = await prisma.user.create({
    data: {
      email: 'plantas.sol@email.com',
      password: emp1Password,
      fullName: 'Soledad Fernández',
      phone: '1167890123',
      dni: '31234567',
      role: UserRole.EMPRENDEDOR,
      status: UserStatus.APROBADO,
      barrioId: barrios[1].id,
    },
  });

  const emprendedor2 = await prisma.emprendedor.create({
    data: {
      userId: emp2User.id,
      businessName: 'Vivero Sol',
      description: 'Plantas de interior, suculentas y macetas decorativas.',
      categoriaId: categorias[1].id,
      horarios: 'Martes a Sábado 10:00 - 17:00',
      acceptsCash: true,
      bankAlias: 'vivero.sol',
      bankCbu: '0000003100012345678901',
      deliveryMethod: DeliveryMethod.RETIRO_DOMICILIO,
      address: 'San Eduardo, Lote 203',
    },
  });

  await prisma.emprendedorBarrio.createMany({
    data: [
      { emprendedorId: emprendedor2.id, barrioId: barrios[0].id },
      { emprendedorId: emprendedor2.id, barrioId: barrios[1].id },
      { emprendedorId: emprendedor2.id, barrioId: barrios[3].id },
      { emprendedorId: emprendedor2.id, barrioId: barrios[4].id },
    ],
  });

  await prisma.producto.createMany({
    data: [
      {
        name: 'Suculenta en Maceta de Cerámica',
        description: 'Suculenta variada en maceta artesanal',
        price: 2500,
        emprendedorId: emprendedor2.id,
        categoriaId: categorias[1].id,
        imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
      },
      {
        name: 'Potus en Maceta Colgante',
        description: 'Potus frondoso ideal para interiores',
        price: 3200,
        emprendedorId: emprendedor2.id,
        categoriaId: categorias[1].id,
        imageUrl: 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=400',
      },
      {
        name: 'Kit Huerta Aromáticas',
        description: 'Kit con 4 plantines de aromáticas: albahaca, orégano, romero y menta',
        price: 4000,
        emprendedorId: emprendedor2.id,
        categoriaId: categorias[1].id,
        imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400',
      },
    ],
  });

  // Create Emprendedor 3 - Servicios
  const emp3User = await prisma.user.create({
    data: {
      email: 'servicios.pablo@email.com',
      password: emp1Password,
      fullName: 'Pablo Rodríguez',
      phone: '1178901234',
      dni: '27654321',
      role: UserRole.EMPRENDEDOR,
      status: UserStatus.APROBADO,
      barrioId: barrios[2].id,
    },
  });

  const emprendedor3 = await prisma.emprendedor.create({
    data: {
      userId: emp3User.id,
      businessName: 'Servicios del Barrio',
      description: 'Mantenimiento de piletas, jardinería y pequeñas reparaciones.',
      categoriaId: categorias[2].id,
      horarios: 'Lunes a Sábado 8:00 - 19:00',
      acceptsCash: true,
      bankAlias: 'pablo.servicios',
      deliveryMethod: DeliveryMethod.PUNTO_ENCUENTRO,
      address: 'San Alfonso',
    },
  });

  await prisma.emprendedorBarrio.createMany({
    data: barrios.map(b => ({ emprendedorId: emprendedor3.id, barrioId: b.id })),
  });

  await prisma.producto.createMany({
    data: [
      {
        name: 'Limpieza de Pileta Mensual',
        description: 'Incluye limpieza semanal, control de químicos y aspirado',
        price: 25000,
        emprendedorId: emprendedor3.id,
        categoriaId: categorias[2].id,
        imageUrl: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400',
      },
      {
        name: 'Corte de Césped',
        description: 'Corte de césped por metro cuadrado (hasta 500m²)',
        price: 15000,
        emprendedorId: emprendedor3.id,
        categoriaId: categorias[2].id,
        imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400',
      },
      {
        name: 'Reparación Eléctrica (hora)',
        description: 'Servicio de electricista por hora',
        price: 8000,
        emprendedorId: emprendedor3.id,
        categoriaId: categorias[2].id,
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
      },
    ],
  });

  // Create a pending emprendedor
  const pendingEmpUser = await prisma.user.create({
    data: {
      email: 'nuevo.emprendedor@email.com',
      password: emp1Password,
      fullName: 'Carlos Nuevo',
      phone: '1199887766',
      dni: '32109876',
      role: UserRole.EMPRENDEDOR,
      status: UserStatus.PENDIENTE,
      barrioId: barrios[0].id,
    },
  });

  await prisma.emprendedor.create({
    data: {
      userId: pendingEmpUser.id,
      businessName: 'Pizzería Carlos',
      description: 'Pizzas a la piedra caseras',
      categoriaId: categorias[0].id,
      horarios: 'Viernes a Domingo 19:00 - 23:00',
      acceptsCash: true,
      deliveryMethod: DeliveryMethod.ENTREGA_PROPIA,
    },
  });

  // Create sample pedido
  const productos = await prisma.producto.findMany({ where: { emprendedorId: emprendedor1.id } });
  
  if (productos.length >= 2) {
    const pedido = await prisma.pedido.create({
      data: {
        userId: vecino.id,
        emprendedorId: emprendedor1.id,
        status: 'ENTREGADO',
        deliveryMethod: DeliveryMethod.ENTREGA_PROPIA,
        deliveryAddress: 'Santa Elena, Lote 145',
        notes: 'Dejar en la puerta',
        total: productos[0].price + productos[1].price,
        items: {
          create: [
            { productoId: productos[0].id, quantity: 1, unitPrice: productos[0].price, subtotal: productos[0].price },
            { productoId: productos[1].id, quantity: 1, unitPrice: productos[1].price, subtotal: productos[1].price },
          ],
        },
      },
    });
    console.log('Created sample pedido:', pedido.id);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
