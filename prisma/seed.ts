// @ts-nocheck
import { PrismaClient, Role, SupplierStatus, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding amélioré...');

  // 1. CLEAR DATABASE
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.supplierOrder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shippingRate.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();

  console.log('🧹 Base de données nettoyée.');

  // 2. PASSWORD HASH
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. ADMIN REQUESTED
  await prisma.user.create({
    data: {
      name: 'Téranga Fil',
      email: 'mfn0002@gmail.com',
      phoneNumber: '789147683',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin "Téranga Fil" créé.');

  // 4. PLANS
  const plans = [
    { name: 'FREE', price: 0, productLimit: 5, hasSpotlight: false, hasStats: false, hasBadge: false, priorityLevel: 0 },
    { name: 'PREMIUM', price: 5000, productLimit: 50, hasSpotlight: true, hasStats: true, hasBadge: true, priorityLevel: 1 },
    { name: 'ULTIMATE', price: 15000, productLimit: 1000, hasSpotlight: true, hasStats: true, hasBadge: true, priorityLevel: 2 },
  ];

  for (const plan of plans) {
    await prisma.plan.create({ data: plan });
  }
  
  const createdPlans = await prisma.plan.findMany();
  const freePlan = createdPlans.find(p => p.name === 'FREE');
  const premiumPlan = createdPlans.find(p => p.name === 'PREMIUM');
  const ultimatePlan = createdPlans.find(p => p.name === 'ULTIMATE');

  console.log('✅ Plans créés.');

  // 5. SUPPLIERS & PRODUCTS
  
  // -- Supplier 1: Dakar Fil --
  const s1User = await prisma.user.create({
    data: { name: 'Awa Diop', email: 'awa@dakarfil.com', phoneNumber: '770000001', password: passwordHash, role: Role.SUPPLIER },
  });
  const s1 = await prisma.supplier.create({
    data: {
      userId: s1User.id,
      shopName: 'Dakar Fil',
      description: 'Spécialiste du fil de coton bio, teint à la main avec des pigments naturels.',
      status: SupplierStatus.ACTIVE,
      logoUrl: 'https://images.unsplash.com/photo-1605256585681-455837661b18?q=80&w=200&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop',
      paymentMethod: 'WAVE',
      paymentPhoneNumber: '770000001'
    },
  });
  await prisma.subscription.create({ data: { supplierId: s1.id, planId: premiumPlan.id, status: SubscriptionStatus.ACTIVE } });

  // -- Supplier 2: Mercerie Abidjan --
  const s2User = await prisma.user.create({
    data: { name: 'Koffi Nguessan', email: 'contact@mercerieabidjan.ci', phoneNumber: '22507070707', password: passwordHash, role: Role.SUPPLIER },
  });
  const s2 = await prisma.supplier.create({
    data: {
      userId: s2User.id,
      shopName: 'Mercerie Abidjan',
      description: 'Tout pour le crochet et le tricot moderne. Importateurs exclusifs.',
      status: SupplierStatus.ACTIVE,
      logoUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=200&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1200&auto=format&fit=crop',
      paymentMethod: 'OM',
      paymentPhoneNumber: '22507070707'
    },
  });
  await prisma.subscription.create({ data: { supplierId: s2.id, planId: ultimatePlan.id, status: SubscriptionStatus.ACTIVE } });
  
  // -- Products --
  const products = [
    { 
      supplierId: s1.id, 
      name: 'Fil de coton bio - Naturel', 
      price: 3500, 
      stock: 150, 
      category: 'Fils', 
      isActive: true,
      hookSize: '3.5mm',
      material: '100% Coton bio',
      weight: '100g',
      length: '250m'
    },
    { 
      supplierId: s1.id, 
      name: 'Crochet Bambou', 
      price: 2500, 
      stock: 8, 
      category: 'Crochets', 
      isActive: true,
      hookSize: '5.0mm'
    },
    // ... basic products ...
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  // -- Mock Orders for Dashboard --
  const clientUser = await prisma.user.create({
    data: { name: 'Mariama Sall', phoneNumber: '771234567', password: passwordHash, role: Role.CLIENT }
  });

  const order1 = await prisma.order.create({
    data: {
      userId: clientUser.id,
      total: 12500,
      status: 'CONFIRMED'
    }
  });

  await prisma.supplierOrder.create({
    data: {
      orderId: order1.id,
      supplierId: s1.id,
      shippingPrice: 1500,
      status: 'PREPARING'
    }
  });

  console.log('✅ Commandes de test créées.');


  console.log('🌱 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
