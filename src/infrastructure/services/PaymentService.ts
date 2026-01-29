import axios from 'axios';

// Types pour les réponses PayDunya
interface PayDunyaInvoiceResponse {
  response_code: string;
  response_text: string;
  token?: string;
  transaction_id?: string;
}

/**
 * Service de paiement utilisant PayDunya
 * Supporte Wave et Orange Money via l'API PayDunya
 */
export class PaymentService {
  private baseUrl: string;
  private masterKey: string;
  private privateKey: string;
  private publicKey: string;
  private token: string;
  private sandboxMode: boolean;

  constructor() {
    // Ces clés doivent être dans votre fichier .env
    this.baseUrl = process.env.PAYDUNYA_BASE_URL || '';
    this.masterKey = process.env.PAYDUNYA_MASTER_KEY || '';
    this.privateKey = process.env.PAYDUNYA_PRIVATE_KEY || '';
    this.publicKey = process.env.PAYDUNYA_PUBLIC_KEY || '';
    this.token = process.env.PAYDUNYA_TOKEN || '';
    this.sandboxMode = process.env.PAYDUNYA_SANDBOX_MODE === 'true';
    
    if (this.sandboxMode) {
      console.log('🧪 PayDunya Sandbox Mode activé - Simulation des paiements');
    }
  }

  /**
   * Initialise un paiement et retourne l'URL de redirection
   */
  async initiatePayment(params: {
    orderId: number;
    amount: number;
    description: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
  }): Promise<{ paymentUrl: string; token: string }> {
    // Mode Sandbox : Simulation sans appel API réel
    if (this.sandboxMode) {
      const sandboxToken = `sandbox_${Date.now()}_${params.orderId}`;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      
      console.log(`🧪 [SANDBOX] Paiement simulé pour commande #${params.orderId}`);
      console.log(`   Montant: ${params.amount} FCFA`);
      console.log(`   Client: ${params.customerName} (${params.customerPhone})`);
      
      // Simuler une page de paiement qui redirige automatiquement après 3 secondes
      return {
        paymentUrl: `${backendUrl}/api/payment/sandbox?token=${sandboxToken}&orderId=${params.orderId}&amount=${params.amount}&returnUrl=${frontendUrl}/checkout/success`,
        token: sandboxToken,
      };
    }
    
    try {
      const response = await axios.post<PayDunyaInvoiceResponse>(
        `${this.baseUrl}/checkout-invoice/create`,
        {
          invoice: {
            total_amount: params.amount,
            description: params.description,
          },
          store: {
            name: 'Teranga Fil',
            tagline: 'Marketplace de produits crochetés',
          },
          custom_data: {
            order_id: params.orderId,
          },
          actions: {
            cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
            return_url: `${process.env.FRONTEND_URL}/checkout/success`,
            callback_url: `${process.env.BACKEND_URL}/api/payment/callback`,
          },
        },
        {
          headers: {
            'PAYDUNYA-MASTER-KEY': this.masterKey,
            'PAYDUNYA-PRIVATE-KEY': this.privateKey,
            'PAYDUNYA-TOKEN': this.token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.response_code === '00') {
        return {
          paymentUrl: response.data.response_text,
          token: response.data.token || '',
        };
      } else {
        throw new Error(response.data.response_text || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error: any) {
      console.error('PayDunya payment initiation error:', error.response?.data || error.message);
      throw new Error('Impossible d\'initialiser le paiement. Veuillez réessayer.');
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async verifyPayment(token: string): Promise<{
    status: string;
    transactionId?: string;
  }> {
    // Mode Sandbox : Simulation
    if (this.sandboxMode) {
      console.log(`🧪 [SANDBOX] Vérification du paiement: ${token}`);
      return {
        status: 'completed',
        transactionId: `sandbox_txn_${Date.now()}`,
      };
    }
    
    try {
      const response = await axios.get<PayDunyaInvoiceResponse>(
        `${this.baseUrl}/checkout-invoice/confirm/${token}`,
        {
          headers: {
            'PAYDUNYA-MASTER-KEY': this.masterKey,
            'PAYDUNYA-PRIVATE-KEY': this.privateKey,
            'PAYDUNYA-TOKEN': this.token,
          },
        }
      );

      if (response.data.response_code === '00') {
        return {
          status: 'completed',
          transactionId: response.data.transaction_id,
        };
      } else if (response.data.response_code === '01') {
        return { status: 'pending' };
      } else {
        return { status: 'failed' };
      }
    } catch (error: any) {
      console.error('PayDunya payment verification error:', error.response?.data || error.message);
      return { status: 'failed' };
    }
  }

  /**
   * Traite le callback de PayDunya (webhook)
   */
  async handleCallback(data: any): Promise<{
    orderId: number;
    status: 'completed' | 'failed';
    transactionId?: string;
  }> {
    const orderId = data.custom_data?.order_id;
    
    if (data.status === 'completed') {
      return {
        orderId,
        status: 'completed',
        transactionId: data.transaction_id,
      };
    } else {
      return {
        orderId,
        status: 'failed',
      };
    }
  }

  /**
   * Envoie un paiement à un fournisseur via PayDunya
   * Utilisé pour les versements instantanés après confirmation de commande
   */
  async sendPayout(params: {
    supplierId: number;
    amount: number;
    phoneNumber: string;
    method: string; // WAVE ou OM
    reference: string; // Ex: "Payout-Order-123-Supplier-45"
  }): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    // Mode Sandbox : Simulation
    if (this.sandboxMode) {
      console.log(`🧪 [SANDBOX] Versement simulé au fournisseur #${params.supplierId}`);
      console.log(`   Montant: ${params.amount} FCFA`);
      console.log(`   Méthode: ${params.method}`);
      console.log(`   Numéro: ${params.phoneNumber}`);
      console.log(`   Référence: ${params.reference}`);
      
      // Simuler un succès
      return {
        success: true,
        transactionId: `sandbox_payout_${Date.now()}_${params.supplierId}`,
      };
    }
    
    try {
      // PayDunya supporte les transferts directs via l'API "Direct Pay"
      // Documentation: https://paydunya.com/developers/direct-pay
      
      const response = await axios.post<any>(
        `${this.baseUrl}/direct-pay/credit-account`,
        {
          account_alias: params.phoneNumber,
          amount: params.amount,
          withdraw_mode: params.method.toLowerCase(), // 'wave' ou 'om'
          description: params.reference,
        },
        {
          headers: {
            'PAYDUNYA-MASTER-KEY': this.masterKey,
            'PAYDUNYA-PRIVATE-KEY': this.privateKey,
            'PAYDUNYA-TOKEN': this.token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.response_code === '00' || response.data.status === 'success') {
        return {
          success: true,
          transactionId: response.data.transaction_id || response.data.receipt_number,
        };
      } else {
        return {
          success: false,
          error: response.data.response_text || response.data.message || 'Échec du versement',
        };
      }
    } catch (error: any) {
      console.error('PayDunya payout error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors du versement',
      };
    }
  }
}
