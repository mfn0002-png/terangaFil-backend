import { FastifyReply, FastifyRequest } from 'fastify';
import { ValidateSupplierUseCase } from '../../../application/use-cases/admin/ValidateSupplier.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';
import { SupplierStatus } from '../../../core/entities/Supplier.js';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { NotificationService, NotificationType } from '../../../infrastructure/services/NotificationService.js';
import { PaymentService } from '../../../infrastructure/services/PaymentService.js';
import crypto from 'crypto';

const notificationService = new NotificationService();
const paymentService = new PaymentService();

export class AdminController {
  async validateSupplier(request: FastifyRequest, reply: FastifyReply) {
    const { id: idStr } = request.params as { id: string };
    const id = Number(idStr);
    const { status } = request.body as { status: SupplierStatus };

    const repository = new PrismaSupplierRepository();
    const useCase = new ValidateSupplierUseCase(repository);

    try {
      const supplier = await useCase.execute(id, status);
      return reply.send(supplier);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async listSuppliers(request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) {
    try {
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [suppliers, total] = await Promise.all([
        (prisma as any).supplier.findMany({
          skip,
          take: limit,
          include: {
            user: true,
            _count: { select: { products: true } },
          },
        }),
        prisma.supplier.count()
      ]);

      // Calculer les performances pour chaque fournisseur
      const suppliersWithStats = await Promise.all(suppliers.map(async (s: any) => {
        const salesStats = await prisma.orderItem.aggregate({
          where: { product: { supplierId: s.id }, order: { status: 'CONFIRMED' } },
          _sum: { quantity: true, price: true },
        });

        return {
          ...s,
          totalSales: salesStats._sum.quantity || 0,
          totalRevenue: salesStats._sum.price || 0,
        };
      }));

      return reply.send({
        data: suppliersWithStats,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List suppliers error:', error);
      return reply.status(500).send({ message: 'Erreur lors de la récupération des fournisseurs' });
    }
  }

  async listAllProducts(request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) {
    try {
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        (prisma as any).product.findMany({
          skip,
          take: limit,
          include: {
            supplier: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count()
      ]);

      return reply.send({
        data: products,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List products error:', error);
      return reply.status(500).send({ message: 'Erreur lors de la récupération des produits' });
    }
  }

  async toggleProductVisibility(
    request: FastifyRequest<{ Params: { id: string }; Body: { isActive: boolean } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { isActive } = request.body;

      const product = await prisma.product.update({
        where: { id: Number(id) },
        data: { isActive },
      });

      return reply.send({ success: true, product });
    } catch (error) {
      return reply.status(500).send({ message: 'Erreur lors de la modification de la visibilité' });
    }
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Chiffre d'Affaires Global
      const totalRevenue = await prisma.order.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { total: true },
      });

      // Commissions Totales
      const totalCommissions = await prisma.supplierPayout.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { commission: true },
      });

      // Fournisseurs en attente
      const pendingSuppliersCount = await prisma.supplier.count({
        where: { status: 'PENDING' },
      });

      // Total Fournisseurs
      const totalSuppliersCount = await prisma.supplier.count();

      // Dernières transactions
      const recentTransactions = await prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              items: {
                take: 1,
                include: { product: { include: { supplier: true } } }
              }
            }
          }
        }
      });

      return reply.send({
        totalRevenue: totalRevenue._sum.total || 0,
        totalCommissions: totalCommissions._sum.commission || 0,
        pendingSuppliersCount,
        totalSuppliersCount,
        recentTransactions: recentTransactions.map(t => ({
          id: t.id,
          orderId: t.orderId,
          amount: t.amount,
          date: t.createdAt,
          status: t.status,
          method: t.method,
          shopName: t.order.items[0]?.product.supplier.shopName || 'N/A'
        }))
      });
    } catch (error: any) {
      console.error('Admin stats error:', error);
      return reply.status(500).send({ message: 'Erreur lors de la récupération des statistiques' });
    }
  }

  async getCommissionHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payouts = await prisma.supplierPayout.findMany({
        include: {
          supplier: true,
          order: {
            include: {
              payment: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(payouts);
    } catch (error) {
      console.error('Commission history error:', error);
      return reply.status(500).send({ message: 'Erreur lors de la récupération de l\'historique' });
    }
  }

  /**
   * Invite un nouveau fournisseur par email
   */
  async inviteSupplier(
    request: FastifyRequest<{ Body: { email: string; name: string; shopName: string; phoneNumber: string; status: SupplierStatus } }>,
    reply: FastifyReply
  ) {
    try {
      const { email, name, shopName, phoneNumber, status } = request.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { phoneNumber }] }
      });

      if (existingUser) {
        return reply.status(400).send({ message: 'Un utilisateur avec cet email ou numéro existe déjà' });
      }

      const setupToken = crypto.randomUUID();

      // Création User + Supplier
      const user = await (prisma as any).user.create({
        data: {
          email,
          name,
          phoneNumber,
          password: 'NOT_SET_' + crypto.randomBytes(8).toString('hex'), 
          role: 'SUPPLIER',
          isPasswordSet: false,
          setupToken,
          supplier: {
            create: {
              shopName,
              status: status || 'PENDING',
            }
          }
        },
        include: { supplier: true }
      });

      // Envoi de l'invitation
      await notificationService.send({
        userId: user.id,
        title: 'Bienvenue sur Teranga Fil',
        message: `L'administrateur vous a invité à rejoindre la plateforme en tant que vendeur. Veuillez configurer votre mot de passe pour accéder à votre espace boutique.`,
        type: NotificationType.SUCCESS,
        link: `/auth/setup-password?token=${setupToken}`
      });

      return reply.send({ success: true, user });
    } catch (error: any) {
      console.error('Invite supplier error:', error);
      return reply.status(500).send({ message: 'Erreur lors de l\'invitation du fournisseur' });
    }
  }

  /**
   * Affiche les détails complets d'un fournisseur
   */
  async getSupplierDetails(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const supplier = await (prisma as any).supplier.findUnique({
        where: { id: Number(id) },
        include: {
          user: true,
          _count: { select: { products: true, orders: true } },
          subscriptions: { 
            include: { plan: true }, 
            orderBy: { createdAt: 'desc' } as any, 
            take: 1 
          }
        }
      });

      if (!supplier) return reply.status(404).send({ message: 'Fournisseur non trouvé' });

      // Stats de vente
      const salesStats = await prisma.orderItem.aggregate({
        where: { product: { supplierId: Number(id) }, order: { status: 'CONFIRMED' } },
        _sum: { quantity: true, price: true },
      });

      return reply.send({
        ...supplier,
        stats: {
          totalSales: salesStats._sum.quantity || 0,
          totalRevenue: salesStats._sum.price || 0,
        }
      });
    } catch (error) {
       console.error('Supplier details error:', error);
       return reply.status(500).send({ message: 'Erreur lors de la récupération des détails' });
    }
  }

  /**
   * Relance un versement fournisseur échoué
   */
  async retryPayout(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const payout = await prisma.supplierPayout.findUnique({
        where: { id: Number(id) },
        include: { supplier: true }
      });

      if (!payout) return reply.status(404).send({ message: 'Versement non trouvé' });
      if (payout.status === 'COMPLETED') return reply.status(400).send({ message: 'Ce versement est déjà complété' });

      // Retenter le transfert via PayDunya (logic existant dans PaymentService)
      const transferResult = await (paymentService as any).transferToAccount(
        payout.supplier.paymentPhoneNumber || (payout.supplier as any).phoneNumber, 
        (payout as any).amount,
        `Retente Versement Commande #${(payout as any).orderId}`
      );

      if (transferResult.success) {
        await prisma.supplierPayout.update({
          where: { id: Number(id) },
          data: { status: 'COMPLETED' }
        });
        return reply.send({ success: true, message: 'Versement relancé avec succès' });
      } else {
        return reply.status(500).send({ success: false, message: 'Échec de la relance : ' + transferResult.message });
      }
    } catch (error: any) {
      return reply.status(500).send({ message: 'Erreur lors de la relance du paiement' });
    }
  }
}
