// @ts-nocheck
import { PrismaClient, Role, SupplierStatus, SubscriptionStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- DONNÉES DE GÉNÉRATION ALÉATOIRE ---
const FIRST_NAMES = ['Awa', 'Fatou', 'Mamadou', 'Koffi', 'Mariama', 'Ousmane', 'Seydou', 'Aminata', 'Cheikh', 'Ndéye'];
const LAST_NAMES = ['Diop', 'Fall', 'Ndiaye', 'Sall', 'Gueye', 'Touré', 'Sarr', 'Cissé', 'Nguessan', 'Bâ'];
const CATEGORIES = ['Fils', 'Crochets', 'Aiguilles', 'Kits', 'Accessoires'];
const COLORS = ['Naturel', 'Rouge carmin', 'Bleu indigo', 'Jaune moutarde', 'Gris anthracite', 'Rose bonbon', 'Vert olive', 'Noir profond'];
const SIZES = ['S', 'M', 'L', 'XL', '250m', '500m', '100g', '50g'];
const SHOP_ADJECTIVES = ['Filatures', 'Ateliers', 'Mercerie', 'Créations', 'Tricot', 'Laine', 'Fibres'];
const CITIES = ['Dakar', 'Saint-Louis', 'Thiès', 'Abidjan', 'Bamako'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randBool = () => Math.random() > 0.5;

async function main() {
  console.log('🌱 Début du seeding massif...');

  // 1. CLEAR DATABASE
  console.log('🧹 Nettoyage de la base de données (ceci peut prendre quelques secondes)...');
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.supplierOrder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.supplierPayout.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shippingRate.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();
  console.log('✅ Base de données nettoyée.');

  // 2. PASSWORD HASH
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. ADMIN REQUESTED
  await prisma.user.create({
    data: {
      name: 'Téranga Fil Admin',
      email: 'mfn0002@gmail.com',
      phoneNumber: '789147683',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin "Téranga Fil" créé.');

  // 4. PLANS
  const plans = [
    { name: 'FREE', price: 0, productLimit: 5, hasSpotlight: false, hasStats: false, hasBadge: false, priorityLevel: 0, commissionRate: 15 },
    { name: 'PREMIUM', price: 5000, productLimit: 50, hasSpotlight: true, hasStats: true, hasBadge: true, priorityLevel: 1, commissionRate: 10 },
    { name: 'ULTIMATE', price: 15000, productLimit: 1000, hasSpotlight: true, hasStats: true, hasBadge: true, priorityLevel: 2, commissionRate: 5 },
  ];

  for (const plan of plans) {
    await prisma.plan.create({ data: plan });
  }
  const createdPlans = await prisma.plan.findMany();
  console.log('✅ Plans créés.');

  // 5. FOURNISSEURS MASSIFS (15)
  console.log('🏭 Création des fournisseurs et de leurs catalogues...');
  const suppliersInfo = [];

  for (let i = 1; i <= 15; i++) {
    const firstName = rand(FIRST_NAMES);
    const lastName = rand(LAST_NAMES);
    const shopName = `${rand(SHOP_ADJECTIVES)} ${lastName} ${rand(CITIES)}`;
    
    // Création du User Fournisseur
    const user = await prisma.user.create({
      data: { 
        name: `${firstName} ${lastName}`, 
        email: `fournisseur${i}@yopmail.com`, 
        phoneNumber: `77000${i.toString().padStart(4, '0')}`, 
        password: passwordHash, 
        role: Role.SUPPLIER 
      },
    });

    // Création de la boutique
    const supplier = await prisma.supplier.create({
      data: {
        userId: user.id,
        shopName: shopName,
        description: `Boutique de qualité par ${firstName}. Nous vendons les meilleurs fils de ${rand(CITIES)}.`,
        status: SupplierStatus.ACTIVE,
        logoUrl: `https://picsum.photos/seed/logo${i}/200/200`,
        bannerUrl: `https://picsum.photos/seed/banner${i}/1200/400`,
        paymentMethod: randBool() ? 'WAVE' : 'OM',
        paymentPhoneNumber: `77000${i.toString().padStart(4, '0')}`
      },
    });

    // Souscription
    const assignedPlan = rand(createdPlans);
    await prisma.subscription.create({ 
      data: { supplierId: supplier.id, planId: assignedPlan.id, status: SubscriptionStatus.ACTIVE } 
    });

    suppliersInfo.push(supplier);

    // 6. PRODUITS POUR CE FOURNISSEUR (5 à 20 produits)
    const nbProducts = randInt(5, 20);
    const productPromises = [];
    
    for (let j = 1; j <= nbProducts; j++) {
      const category = rand(CATEGORIES);
      const isSpotlight = assignedPlan.name !== 'FREE' && randInt(1, 10) > 8; // 20% de chances d'être en vedette si payant
      
      productPromises.push(prisma.product.create({
        data: {
          supplierId: supplier.id,
          name: `${category} Premium ${j} - ${rand(COLORS)}`,
          price: randInt(10, 150) * 100, // prix entre 1000 et 15000 FCFA
          stock: randInt(0, 100),
          category: category,
          isActive: true,
          isSpotlight: isSpotlight,
          imageUrl: `https://picsum.photos/seed/prod${supplier.id}${j}/800/800`,
          images: [
             `https://picsum.photos/seed/prodA${supplier.id}${j}/800/800`,
             `https://picsum.photos/seed/prodB${supplier.id}${j}/800/800`
          ],
          description: `Un excellent article pour vos projets. Qualité exceptionnelle.`,
          material: randBool() ? '100% Coton bio' : 'Acrylique / Laine',
          colors: [rand(COLORS), rand(COLORS)],
          sizes: [rand(SIZES)]
        }
      }));
    }
    await Promise.all(productPromises);
  }
  console.log(`✅ ${suppliersInfo.length} Fournisseurs et leurs produits créés.`);

  // 7. CLIENTS MASSIFS (20)
  console.log('🛍️ Création des clients et commandes...');
  const clients = [];
  for (let i = 1; i <= 20; i++) {
    const clientUser = await prisma.user.create({
      data: { 
        name: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`, 
        email: `client${i}@yopmail.com`,
        phoneNumber: `70111${i.toString().padStart(4, '0')}`, 
        password: passwordHash, 
        role: Role.CLIENT 
      }
    });
    clients.push(clientUser);
  }

  // 8. COMMANDES (50)
  const allProducts = await prisma.product.findMany({ select: { id: true, price: true, supplierId: true } });
  
  for (let i = 1; i <= 50; i++) {
    const client = rand(clients);
    const nbItems = randInt(1, 4);
    
    let total = 0;
    const orderItemsData = [];
    const suppliersInOrder = new Set();
    
    for (let j = 0; j < nbItems; j++) {
      const prod = rand(allProducts);
      const qty = randInt(1, 3);
      const lineTotal = prod.price * qty;
      total += lineTotal;
      suppliersInOrder.add(prod.supplierId);
      
      orderItemsData.push({
        productId: prod.id,
        quantity: qty,
        price: prod.price,
      });
    }

    // Un faux statut aléatoire
    const statuses = Object.values(OrderStatus);
    const orderStatus = statuses[randInt(0, statuses.length - 1)];

    const order = await prisma.order.create({
      data: {
        userId: client.id,
        total: total,
        status: orderStatus,
        customerFirstName: client.name.split(' ')[0],
        customerLastName: client.name.split(' ')[1] || 'Fall',
        customerPhoneNumber: client.phoneNumber,
        customerAddress: `Rue ${randInt(1, 100)}, ${rand(CITIES)}`,
        items: {
          create: orderItemsData
        }
      }
    });

    // Créer les SupplierOrder
    for (const sId of Array.from(suppliersInOrder)) {
      await prisma.supplierOrder.create({
        data: {
          orderId: order.id,
          supplierId: sId,
          shippingPrice: 1500,
          status: orderStatus // Simplicité: même statut que la commande globale
        }
      });
    }
  }

  console.log('✅ 50 commandes simulées créées.');
  console.log('🌱 Seeding terminé avec succès ! Votre Dashboard devrait être magnifique !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
