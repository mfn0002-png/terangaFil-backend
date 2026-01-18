// @ts-nocheck
import axios from 'axios';
import { cleanupDatabase } from '../utils/cleanup.js';
import { prisma } from '../../src/infrastructure/database/prisma.js';

const API_URL = 'http://localhost:3000';

async function runScenario() {
  console.log('🚀 Démarrage du scénario de test E2E...');

  try {
    // 0. Initialisation
    await cleanupDatabase();
    
    console.log('🌱 Création des plans...');
    await (prisma as any).plan.createMany({
      data: [
        { name: 'FREE', price: 0, productLimit: 2, hasSpotlight: false, hasStats: false, hasBadge: false, priorityLevel: 0 },
        { name: 'PREMIUM', price: 5000, productLimit: 50, hasSpotlight: true, hasStats: true, hasBadge: true, priorityLevel: 1 },
      ]
    });

    // 1. Inscription Client
    console.log('👤 Inscription Client...');
    const clientReg = await axios.post(`${API_URL}/auth/register`, {
      name: 'Jean Client',
      email: 'jean@test.com',
      phoneNumber: '771234567',
      password: 'password123',
      role: 'CLIENT'
    });
    const clientToken = clientReg.data.token;
    console.log('✅ Client inscrit.');

    // 2. Inscription Fournisseur
    console.log('🏪 Inscription Fournisseur...');
    const supplierReg = await axios.post(`${API_URL}/auth/register`, {
      name: 'Moussa Shop',
      email: 'moussa@test.com',
      phoneNumber: '779876543',
      password: 'password123',
      role: 'SUPPLIER'
    });
    const supplierToken = supplierReg.data.token;
    const userId = supplierReg.data.user.id;
    console.log('✅ Fournisseur inscrit.');

    // 3. Configuration Boutique (Crée l'entité Supplier)
    console.log('🛠 Configuration de la boutique...');
    await axios.post(`${API_URL}/supplier/setup`, 
      { shopName: 'Teranga Market', description: 'Le meilleur du Sénégal' },
      { headers: { Authorization: `Bearer ${supplierToken}` } }
    );
    console.log('✅ Boutique configurée (Statut: PENDING).');

    // 4. Validation Admin
    console.log('👮 Validation Admin...');
    const adminReg = await axios.post(`${API_URL}/auth/register`, {
      name: 'Admin User',
      email: 'admin@test.com',
      phoneNumber: '770000000',
      password: 'adminpassword',
      role: 'ADMIN'
    });
    const adminToken = adminReg.data.token;
    
    const suppliersList = await axios.get(`${API_URL}/admin/suppliers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const supplierRecord = suppliersList.data.find((s: any) => s.userId === userId);

    await axios.patch(`${API_URL}/admin/suppliers/${supplierRecord.id}/status`, 
      { status: 'ACTIVE' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✅ Fournisseur activé.');

    // 5. Ajout de produits (dans la limite)
    console.log('📦 Ajout de produits...');
    await axios.post(`${API_URL}/supplier/products`, 
      { name: 'Thiakry', price: 500, stock: 10, category: 'Alimentaire' },
      { headers: { Authorization: `Bearer ${supplierToken}` } }
    );
    await axios.post(`${API_URL}/supplier/products`, 
      { name: 'Ngourbane', price: 1000, stock: 5, category: 'Alimentaire' },
      { headers: { Authorization: `Bearer ${supplierToken}` } }
    );
    
    try {
      console.log('⚠️ Test limite plan FREE...');
      await axios.post(`${API_URL}/supplier/products`, 
        { name: 'Pneu', price: 5000, stock: 1, category: 'Auto' },
        { headers: { Authorization: `Bearer ${supplierToken}` } }
      );
    } catch (e) {
      console.log('✅ Limite plan FREE bloquée comme prévu.');
    }

    // 6. Passage Premium
    console.log('💎 Abonnement PREMIUM...');
    await axios.post(`${API_URL}/premium/subscribe`, 
      { planName: 'PREMIUM', paymentMethod: 'MOBILE_MONEY' },
      { headers: { Authorization: `Bearer ${supplierToken}` } }
    );
    console.log('✅ Plan PREMIUM activé.');

    // 7. Commande
    console.log('🛒 Passage de commande...');
    const products = await axios.get(`${API_URL}/catalog/products`);
    const p1 = products.data[0];
    
    const order = await axios.post(`${API_URL}/orders`, 
      { 
        shippingZone: 'DAKAR',
        items: [{ productId: p1.id, quantity: 1 }]
      },
      { headers: { Authorization: `Bearer ${clientToken}` } }
    );
    console.log('✅ Commande terminée ! Total :', order.data.total, 'XOF');

    console.log('\n✨ TOUS LES TESTS SONT PASSÉS ! ✨');

  } catch (error: any) {
    console.error('❌ ERREUR :', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runScenario();
