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
    },
  });
  await prisma.subscription.create({ data: { supplierId: s2.id, planId: ultimatePlan.id, status: SubscriptionStatus.ACTIVE } });

  // -- Supplier 3: Petits Filous --
  const s3User = await prisma.user.create({
    data: { name: 'Sophie Diallo', email: 'sophie@gmail.com', phoneNumber: '778889900', password: passwordHash, role: Role.SUPPLIER },
  });
  const s3 = await prisma.supplier.create({
    data: {
      userId: s3User.id,
      shopName: 'Petits Filous',
      description: 'Accessoires mignons faits main par des passionnés.',
      status: SupplierStatus.ACTIVE,
      logoUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=200&auto=format&fit=crop',
    },
  });
  await prisma.subscription.create({ data: { supplierId: s3.id, planId: freePlan.id, status: SubscriptionStatus.ACTIVE } });

  // -- Supplier 4: Tissus & Couleurs (New) --
  const s4User = await prisma.user.create({
    data: { name: 'Mariama Ba', email: 'mariama@tissus.com', phoneNumber: '775556677', password: passwordHash, role: Role.SUPPLIER },
  });
  const s4 = await prisma.supplier.create({
    data: {
      userId: s4User.id,
      shopName: 'Tissus & Couleurs',
      description: 'Le paradis du Wax et des tissus traditionnels.',
      status: SupplierStatus.ACTIVE,
      logoUrl: 'https://images.unsplash.com/photo-1616606004928-19962e840d4f?q=80&w=200&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1526661334543-d343f11d13f5?q=80&w=1200&auto=format&fit=crop',
    },
  });
  await prisma.subscription.create({ data: { supplierId: s4.id, planId: premiumPlan.id, status: SubscriptionStatus.ACTIVE } });

  console.log('✅ Fournisseurs créés.');

  // 6. PRODUCTS (Extended List)
  const products = [
    // Dakar Fil
    { 
      supplierId: s1.id, 
      name: 'Pelote Coton Bio - Terracotta', 
      price: 4500, 
      stock: 100, 
      category: 'Fils', 
      imageUrl: '/images/cat_yarn.png', 
      images: [
        '/images/cat_yarn.png',
        'https://images.unsplash.com/photo-1542062534-c782161c569f?q=80&w=1200', 
        'https://images.unsplash.com/photo-1520106689620-80bb4120c159?q=80&w=1200'
      ],
      description: "Notre fil de coton d'Afrique est issu d'une production locale et responsable. Chaque écheveau est soigneusement préparé pour garantir une douceur exceptionnelle et une tenue parfaite de vos ouvrages. Idéal pour les vêtements d'été, les accessoires de décoration ou les doudous amigurumis.",
      material: '100% Coton',
      weight: '100g',
      length: '200m',
      usage: 'Crochet 3.5mm-4mm',
      colors: ['Terracotta', 'Beige', 'Gris Perle'],
      isSpotlight: true 
    },
    { 
      supplierId: s1.id, 
      name: 'Fil de Soie Végétale - Or', 
      price: 6000, 
      stock: 45, 
      category: 'Fils', 
      imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80',
      images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633'],
      description: "Un fil soyeux et brillant, parfait pour des créations élégantes.",
      material: 'Soie Végétale',
      weight: '50g',
      length: '150m',
      usage: 'Aiguilles 3mm',
      colors: ['Or', 'Argent', 'Bronze'],
      isSpotlight: true 
    },
    { 
      supplierId: s1.id, 
      name: 'Kit Macramé Débutant', 
      price: 12500, 
      stock: 20, 
      category: 'Kits', 
      imageUrl: 'https://images.unsplash.com/photo-1601268689369-026c2e366fd2?q=80&w=1200',
      description: 'Tout le nécessaire pour débuter le macramé.',
      colors: ['Naturel'],
    },
    { supplierId: s1.id, name: 'Laine Mérinos - Bleu Nuit', price: 8900, stock: 30, category: 'Fils', imageUrl: 'https://images.unsplash.com/photo-1542062534-c782161c569f?q=80&w=1200', images: ['https://images.unsplash.com/photo-1542062534-c782161c569f?q=80&w=1200'], description: 'Laine mérinos douce et chaude, idéale pour les projets d\'hiver.', material: '100% Laine Mérinos', weight: '100g', length: '180m', colors: ['Bleu Nuit', 'Gris', 'Noir'] },
    { supplierId: s1.id, name: 'Corde Coton 5mm - Naturel', price: 3500, stock: 150, category: 'Fils', imageUrl: 'https://images.unsplash.com/photo-1520106689620-80bb4120c159?q=80&w=1200', images: ['https://images.unsplash.com/photo-1520106689620-80bb4120c159?q=80&w=1200'], description: 'Corde en coton naturel, parfaite pour le macramé et les suspensions.', material: '100% Coton', weight: '250g', length: '50m', colors: ['Naturel', 'Écru'] },

    // Mercerie Abidjan
    { supplierId: s2.id, name: 'Set de Crochets Ergonomiques', price: 15000, stock: 30, category: 'Crochets', imageUrl: '/images/cat_crochet.png', images: ['/images/cat_crochet.png'], description: 'Set complet de crochets ergonomiques pour un confort optimal.', colors: ['Multicolore'], isSpotlight: true },
    { supplierId: s2.id, name: 'Ciseaux Vintage Dorés', price: 8000, stock: 15, category: 'Accessoires', imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1200', images: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1200'], description: 'Ciseaux de couture vintage avec finition dorée élégante.', material: 'Acier inoxydable', colors: ['Doré'] },
    { supplierId: s2.id, name: 'Aiguilles Circulaires Pro', price: 9500, stock: 25, category: 'Accessoires', imageUrl: 'https://images.unsplash.com/photo-1620242203923-38c23363364f?q=80&w=1200', images: ['https://images.unsplash.com/photo-1620242203923-38c23363364f?q=80&w=1200'], description: 'Aiguilles circulaires professionnelles pour tricot.', material: 'Métal et câble', colors: ['Argenté'] },
    { supplierId: s2.id, name: 'Marqueurs de Maille (Lot de 50)', price: 4500, stock: 100, category: 'Accessoires', imageUrl: 'https://images.unsplash.com/photo-1604332159041-5df79b476e33?q=80&w=1200', images: ['https://images.unsplash.com/photo-1604332159041-5df79b476e33?q=80&w=1200'], description: 'Lot de 50 marqueurs de maille colorés pour vos projets.', colors: ['Multicolore'] },

    // Petits Filous
    { supplierId: s3.id, name: 'Boutons en Bois (Lot)', price: 3500, stock: 200, category: 'Accessoires', imageUrl: '/images/cat_accessory.png', images: ['/images/cat_accessory.png'], description: 'Assortiment de boutons en bois naturel pour vos créations.', material: 'Bois naturel', colors: ['Naturel', 'Marron'] },
    { supplierId: s3.id, name: 'Ruban Satin - Rose Poudré', price: 1500, stock: 500, category: 'Accessoires', imageUrl: 'https://images.unsplash.com/photo-1585848877543-5aa50450257c?q=80&w=1200', images: ['https://images.unsplash.com/photo-1585848877543-5aa50450257c?q=80&w=1200'], description: 'Ruban satin doux et brillant, idéal pour les finitions.', material: 'Satin', length: '5m', colors: ['Rose Poudré', 'Blanc', 'Ivoire'] },
    { supplierId: s3.id, name: 'Étiquettes "Fait Main"', price: 2000, stock: 100, category: 'Accessoires', imageUrl: 'https://images.unsplash.com/photo-1550920405-c38ca8cb2a6e?q=80&w=1200', images: ['https://images.unsplash.com/photo-1550920405-c38ca8cb2a6e?q=80&w=1200'], description: 'Étiquettes tissées "Fait Main" pour personnaliser vos créations.', material: 'Tissu', colors: ['Beige'] },

    // Tissus & Couleurs
    { 
      supplierId: s4.id, 
      name: 'Wax Hollandais - Fleurs', 
      price: 4000, 
      stock: 60, 
      category: 'Tissus', 
      imageUrl: 'https://plus.unsplash.com/premium_photo-1664303869263-ce40a996f634?q=80&w=1200', 
      images: ['https://plus.unsplash.com/premium_photo-1664303869263-ce40a996f634'],
      description: 'Tissu wax hollandais authentique avec motifs floraux vibrants.',
      material: '100% Coton ciré',
      weight: '180g/m²',
      length: '6 yards',
      colors: ['Rouge/Jaune', 'Bleu/Vert'],
      isSpotlight: true 
    },
    { supplierId: s4.id, name: 'Bazin Riche - Blanc', price: 7500, stock: 40, category: 'Tissus', imageUrl: 'https://images.unsplash.com/photo-1574635848601-527e0292728f?q=80&w=1200', images: ['https://images.unsplash.com/photo-1574635848601-527e0292728f?q=80&w=1200'], description: 'Bazin riche de qualité supérieure, parfait pour les tenues de cérémonie.', material: 'Coton damassé', weight: '220g/m²', colors: ['Blanc', 'Ivoire', 'Écru'] },
    { supplierId: s4.id, name: 'Soie Sauvage - Émeraude', price: 12000, stock: 15, category: 'Tissus', imageUrl: 'https://images.unsplash.com/photo-1549403169-p8b688c2b7g0?q=80&w=1200', images: ['https://images.unsplash.com/photo-1549403169-p8b688c2b7g0?q=80&w=1200'], description: 'Soie sauvage luxueuse avec texture naturelle unique.', material: '100% Soie sauvage', weight: '140g/m²', colors: ['Émeraude', 'Saphir', 'Rubis'] },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ 15+ Produits créés.');

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
