import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../../../infrastructure/services/PaymentService.js';
import { prisma } from '../../../infrastructure/database/prisma.js';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Initialise un paiement pour une commande
   */
  async initiatePayment(
    request: FastifyRequest<{
      Body: {
        orderId: number;
        amount: number;
        customerName: string;
        customerEmail?: string;
        customerPhone: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { orderId, amount, customerName, customerEmail, customerPhone } = request.body;

      // Vérifier que la commande existe
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return reply.status(404).send({ message: 'Commande introuvable' });
      }

      // Initialiser le paiement via PayDunya
      const paymentData = await this.paymentService.initiatePayment({
        amount,
        description: `Commande #${orderId} - Teranga Fil`,
        orderId,
        customerName,
        customerEmail,
        customerPhone,
      });

      // Sauvegarder le token de paiement dans la commande (optionnel)
      // Vous pouvez créer un modèle Payment séparé si nécessaire

      return reply.send({
        success: true,
        paymentUrl: paymentData.paymentUrl,
        token: paymentData.token,
      });
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      return reply.status(500).send({
        message: error.message || 'Erreur lors de l\'initialisation du paiement',
      });
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async verifyPayment(
    request: FastifyRequest<{
      Params: { token: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { token } = request.params;

      const paymentStatus = await this.paymentService.verifyPayment(token);

      if (paymentStatus.status === 'completed') {
        // Mettre à jour le statut de la commande
        // Vous devrez stocker la relation token <-> orderId quelque part
        return reply.send({
          success: true,
          status: 'completed',
          transactionId: paymentStatus.transactionId,
        });
      }

      return reply.send({
        success: true,
        status: paymentStatus.status,
      });
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return reply.status(500).send({
        message: 'Erreur lors de la vérification du paiement',
      });
    }
  }

  /**
   * Callback webhook de PayDunya
   */
  async handleCallback(
    request: FastifyRequest<{
      Body: any;
    }>,
    reply: FastifyReply
  ) {
    try {
      const callbackData = request.body as any;

      const result = await this.paymentService.handleCallback(callbackData);

      if (result.status === 'completed') {
        // 1. Mettre à jour le statut de la commande
        const order = await prisma.order.update({
          where: { id: result.orderId },
          data: { status: 'CONFIRMED' },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    supplier: true,
                  },
                },
              },
            },
          },
        });

        // 2. Créer l'enregistrement Payment
        console.log(`💳 [PAYMENT] Nouveau paiement reçu pour la commande #${result.orderId}`);
        console.log(`   - Montant Total: ${order.total} FCFA`);
        console.log(`   - Transaction ID: ${result.transactionId}`);
        console.log(`   - Méthode: ${callbackData.payment_method || 'WAVE'}`);

        await prisma.payment.create({
          data: {
            orderId: result.orderId,
            amount: order.total,
            method: callbackData.payment_method || 'WAVE',
            status: 'COMPLETED',
            transactionId: result.transactionId,
            paydunyaToken: callbackData.token,
          },
        });

        // 3. Grouper les items par fournisseur et calculer les versements
        const supplierGroups: Record<number, any> = {};
        
        for (const item of order.items) {
          const supplierId = item.product.supplierId;
          if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = {
              supplier: item.product.supplier,
              items: [],
              subtotal: 0,
              shippingPrice: 0,
            };
          }
          supplierGroups[supplierId].items.push(item);
          supplierGroups[supplierId].subtotal += item.price * item.quantity;
        }

        // 4. Calculer frais de port et commission pour chaque fournisseur
        for (const supplierIdStr in supplierGroups) {
          const supplierId = Number(supplierIdStr);
          const group = supplierGroups[supplierId];
          
          // Récupérer le taux de commission du fournisseur
          const activeSubscription = await prisma.subscription.findFirst({
            where: { supplierId, status: 'ACTIVE' },
            include: { plan: true },
            orderBy: { startDate: 'desc' },
          });

          const commissionRate = activeSubscription?.plan?.commissionRate || 15;
          const commission = Math.round((group.subtotal * commissionRate) / 100);

          // Calculer les frais de port
          const uniqueZones = new Set<string>();
          for (const item of group.items) {
            if (item.shippingZone) {
              const rate = group.supplier.shipping.find(
                (r: any) => r.zone.toLowerCase() === item.shippingZone.toLowerCase()
              );
              if (rate) {
                uniqueZones.add(`${item.shippingZone}_${rate.price}`);
              }
            }
          }

          let shippingPrice = 0;
          uniqueZones.forEach((zoneKey: string) => {
            const [_, price] = zoneKey.split('_');
            shippingPrice += Number(price);
          });

          const netAmount = (group.subtotal - commission) + shippingPrice;

          console.log(`📦 [DISTRIBUTION] Distribution pour Fournisseur #${supplierId} (${group.supplier.shopName}) :`);
          console.log(`   - Sous-total: ${group.subtotal} FCFA`);
          console.log(`   - Commission (${commissionRate}%): ${commission} FCFA`);
          console.log(`   - Frais de port: ${shippingPrice} FCFA`);
          console.log(`   - Montant Net à verser: ${netAmount} FCFA`);

          // 5. Créer l'enregistrement SupplierPayout
          const payout = await prisma.supplierPayout.create({
            data: {
              orderId: result.orderId,
              supplierId,
              subtotal: group.subtotal,
              commission,
              commissionRate,
              shippingPrice,
              netAmount,
              paymentMethod: group.supplier.paymentMethod || 'WAVE',
              phoneNumber: group.supplier.paymentPhoneNumber,
              status: 'PENDING',
            },
          });

          // 6. Effectuer le versement instantané si le fournisseur a configuré ses infos
          if (group.supplier.paymentPhoneNumber && group.supplier.paymentMethod) {
            try {
              console.log(`💸 [PAYOUT] Envoi du versement vers ${group.supplier.paymentMethod} (${group.supplier.paymentPhoneNumber})...`);
              const payoutResult = await this.paymentService.sendPayout({
                supplierId,
                amount: netAmount,
                phoneNumber: group.supplier.paymentPhoneNumber,
                method: group.supplier.paymentMethod,
                reference: `Payout-Order-${result.orderId}-Supplier-${supplierId}`,
              });

              if (payoutResult.success) {
                await prisma.supplierPayout.update({
                  where: { id: payout.id },
                  data: {
                    status: 'COMPLETED',
                    transactionId: payoutResult.transactionId,
                    processedAt: new Date(),
                  },
                });
                console.log(`✅ [PAYOUT] Succès - Transaction ID: ${payoutResult.transactionId}`);
              } else {
                await prisma.supplierPayout.update({
                  where: { id: payout.id },
                  data: {
                    status: 'FAILED',
                    errorMessage: payoutResult.error,
                  },
                });
                console.error(`❌ [PAYOUT] Échec - Raison: ${payoutResult.error}`);
              }
            } catch (error: any) {
              console.error(`❌ [PAYOUT] Erreur système:`, error.message);
              await prisma.supplierPayout.update({
                where: { id: payout.id },
                data: {
                  status: 'FAILED',
                  errorMessage: error.message,
                },
              });
            }
          } else {
            console.warn(`⚠️ [PAYOUT] Annulé - Coordonnées de paiement manquantes pour le fournisseur #${supplierId}`);
          }
        }

        // 7. Verser la commission totale à l'admin
        const totalCommission = Object.values(supplierGroups).reduce((sum, group) => {
          const commissionRate = group.items[0].product.supplier.activeSubscription?.plan?.commissionRate || 15;
          return sum + Math.round((group.subtotal * commissionRate) / 100);
        }, 0);

        const adminPhone = process.env.ADMIN_PAYMENT_NUMBER;
        const adminMethod = process.env.ADMIN_PAYMENT_METHOD || 'WAVE';

        if (adminPhone && totalCommission > 0) {
          try {
            console.log(`💰 Tentative de versement de la commission admin: ${totalCommission} FCFA`);
            const adminPayoutResult = await this.paymentService.sendPayout({
              supplierId: 0, // 0 pour l'admin
              amount: totalCommission,
              phoneNumber: adminPhone,
              method: adminMethod,
              reference: `Admin-Commission-Order-${result.orderId}`,
            });

            if (adminPayoutResult.success) {
              console.log(`✅ Commission admin versée avec succès: ${totalCommission} FCFA`);
            } else {
              console.error(`❌ Échec du versement de la commission admin:`, adminPayoutResult.error);
            }
          } catch (error: any) {
            console.error(`❌ Erreur lors du versement de la commission admin:`, error.message);
          }
        } else {
          console.warn(`⚠️ Versement admin ignoré : Numéro admin non configuré ou commission nulle`);
        }

        console.log(`✅ Paiement confirmé pour la commande #${result.orderId}`);
      } else {
        console.log(`❌ Paiement échoué pour la commande #${result.orderId}`);
      }

      return reply.send({ success: true });
    } catch (error: any) {
      console.error('Payment callback error:', error);
      return reply.status(500).send({
        message: 'Erreur lors du traitement du callback',
      });
    }
  }
}
