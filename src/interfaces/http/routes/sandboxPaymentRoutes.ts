import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Route sandbox pour simuler la page de paiement PayDunya
 * Utilisé uniquement en mode test (PAYDUNYA_SANDBOX_MODE=true)
 */
export async function sandboxPaymentRoutes(app: FastifyInstance) {
  // Page de simulation de paiement
  app.get('/payment/sandbox', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, orderId, amount, returnUrl } = request.query as any;
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Générer une page HTML qui simule PayDunya
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🧪 Sandbox PayDunya - Simulation de Paiement</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 30px;
      padding: 50px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 30px;
    }
    h1 {
      font-size: 32px;
      font-weight: 900;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .amount {
      font-size: 48px;
      font-weight: 900;
      color: #667eea;
      margin: 30px 0;
    }
    .info {
      background: #f3f4f6;
      border-radius: 20px;
      padding: 20px;
      margin: 30px 0;
      text-align: left;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child { border-bottom: none; }
    .label {
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .value {
      font-size: 14px;
      font-weight: 800;
      color: #1f2937;
    }
    .buttons {
      display: flex;
      gap: 15px;
      margin-top: 40px;
    }
    button {
      flex: 1;
      padding: 18px;
      border: none;
      border-radius: 15px;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-success {
      background: #10b981;
      color: white;
    }
    .btn-success:hover {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
    }
    .btn-cancel {
      background: #ef4444;
      color: white;
    }
    .btn-cancel:hover {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
    }
    .countdown {
      margin-top: 20px;
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
    }
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f4f6;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">🧪 Mode Sandbox</div>
    <h1>Simulation de Paiement</h1>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
      Ceci est une simulation. Aucun argent réel ne sera débité.
    </p>
    
    <div class="amount">${amount.toLocaleString()} FCFA</div>
    
    <div class="info">
      <div class="info-row">
        <span class="label">Commande</span>
        <span class="value">#${orderId}</span>
      </div>
      <div class="info-row">
        <span class="label">Token</span>
        <span class="value">${token.substring(0, 20)}...</span>
      </div>
      <div class="info-row">
        <span class="label">Méthode</span>
        <span class="value">WAVE / Orange Money</span>
      </div>
    </div>
    
    <div class="buttons">
      <button class="btn-cancel" onclick="cancelPayment()">
        ❌ Annuler
      </button>
      <button class="btn-success" onclick="confirmPayment()">
        ✅ Payer
      </button>
    </div>
    
    <div class="countdown" id="countdown"></div>
  </div>
  
  <script>
    const token = '${token}';
    const orderId = '${orderId}';
    const returnUrl = '${returnUrl}';
    const backendUrl = '${backendUrl}';
    
    let countdown = 10;
    const countdownEl = document.getElementById('countdown');
    
    // Compte à rebours pour paiement automatique
    const interval = setInterval(() => {
      countdown--;
      countdownEl.innerHTML = \`Paiement automatique dans <strong>\${countdown}s</strong>...\`;
      
      if (countdown <= 0) {
        clearInterval(interval);
        confirmPayment();
      }
    }, 1000);
    
    async function confirmPayment() {
      countdownEl.innerHTML = '<div class="spinner"></div> Traitement du paiement...';
      
      try {
        // Appeler le callback backend pour confirmer le paiement
        await fetch(\`\${backendUrl}/api/payment/callback\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            status: 'completed',
            transaction_id: \`sandbox_txn_\${Date.now()}\`,
            payment_method: 'WAVE',
            order_id: orderId
          })
        });
        
        // Rediriger vers la page de succès
        window.location.href = returnUrl;
      } catch (error) {
        alert('Erreur lors de la confirmation du paiement');
        console.error(error);
      }
    }
    
    function cancelPayment() {
      const frontendUrl = returnUrl.split('/checkout')[0];
      window.location.href = frontendUrl + '/checkout/cancel';
    }
  </script>
</body>
</html>
    `;
    
    reply.type('text/html').send(html);
  });
}
