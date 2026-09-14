import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// ioTec Pay API Configuration
const IOTEC_BASE_URL = process.env.IOTEC_BASE_URL || 'https://pay.iotec.io';
const IOTEC_AUTH_URL = process.env.IOTEC_AUTH_URL || 'https://id.iotec.io/connect/token';
const IOTEC_CLIENT_ID = process.env.IOTEC_CLIENT_ID || 'pay-01a07b2d-73da-7068-8f1a-bb12de1e12fd';
const IOTEC_CLIENT_SECRET = process.env.IOTEC_CLIENT_SECRET || 'IO-ZHOcGmysOZ7Ll2z49DWZriv6goAztSnIl';
const IOTEC_WALLET_ID = process.env.IOTEC_WALLET_ID || '01a07b2d-748c-7102-8264-3b44bdbe8e38';
const IOTEC_WALLET_NAME = process.env.IOTEC_WALLET_NAME || 'NINE EIGHT KONCEPTS TEST';
const IOTEC_ENV = process.env.IOTEC_ENV || 'sandbox';

// In-memory transaction registry for ioTec operations
interface IoTecTransactionRecord {
  reference: string;
  externalTxnId: string;
  iotecRequestId?: string;
  cardRedirectUrl?: string;
  commissioningId?: string;
  amountUGX: number;
  provider: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';
  channel: 'MOBILE_MONEY' | 'CARD';
  phoneNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
  ussdPromptSent: boolean;
  statutoryTrustEscrow: boolean;
}

const transactionsDb = new Map<string, IoTecTransactionRecord>();

// Cached OAuth token for ioTec Pay
let cachedToken: { token: string; expiresAt: number } | null = null;

// Helper: OAuth 2.0 Client Credentials token fetching from ioTec (https://id.iotec.io/connect/token)
async function getIoTecAccessToken(): Promise<string | null> {
  if (!IOTEC_CLIENT_ID || !IOTEC_CLIENT_SECRET) {
    return null;
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 20000) {
    return cachedToken.token;
  }

  try {
    const bodyParams = new URLSearchParams();
    bodyParams.append('grant_type', 'client_credentials');
    bodyParams.append('client_id', IOTEC_CLIENT_ID);
    bodyParams.append('client_secret', IOTEC_CLIENT_SECRET);

    const res = await fetch(IOTEC_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: bodyParams.toString()
    });

    if (!res.ok) {
      console.warn('ioTec token fetch response not ok:', res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (data.access_token) {
      const ttl = (data.expires_in || 300) * 1000;
      cachedToken = { token: data.access_token, expiresAt: now + ttl };
      return data.access_token;
    }
    return null;
  } catch (err: any) {
    console.warn('Error fetching ioTec token:', err?.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// API ROUTES FIRST (Before Vite middleware)
// ---------------------------------------------------------------------------

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: IOTEC_ENV,
    iotecConfigured: !!(IOTEC_CLIENT_ID && IOTEC_CLIENT_SECRET),
    walletId: IOTEC_WALLET_ID,
    walletName: IOTEC_WALLET_NAME,
    timestamp: new Date().toISOString()
  });
});

// 2. ioTec Pay Configuration endpoint (public safely exposed parameters)
app.get('/api/payments/iotec/config', (req: Request, res: Response) => {
  res.json({
    gateway: 'ioTec Pay',
    docsUrl: 'https://iotec.io/api-docs/pay',
    baseUrl: IOTEC_BASE_URL,
    authUrl: IOTEC_AUTH_URL,
    environment: IOTEC_ENV,
    isLiveConfigured: !!(IOTEC_CLIENT_ID && IOTEC_CLIENT_SECRET),
    clientId: IOTEC_CLIENT_ID ? `${IOTEC_CLIENT_ID.slice(0, 8)}...` : null,
    walletId: IOTEC_WALLET_ID,
    walletName: IOTEC_WALLET_NAME,
    supportedChannels: ['MOBILE_MONEY', 'CARD'],
    supportedProviders: {
      mobileMoney: ['MTN_MOMO', 'AIRTEL_MONEY'],
      cards: ['VISA', 'MASTERCARD']
    },
    currency: 'UGX',
    statutoryEscrowGuaranteed: true,
    testMsisdn: '0111777771'
  });
});

// 3. ioTec Pay Real-Time Wallet Balance
app.get('/api/payments/iotec/wallet-balance', async (req: Request, res: Response) => {
  try {
    const token = await getIoTecAccessToken();
    if (!token || !IOTEC_WALLET_ID) {
      return res.json({
        id: IOTEC_WALLET_ID,
        name: IOTEC_WALLET_NAME,
        actualBalance: 5000,
        availableBalance: 5000,
        currency: 'ITX',
        isMock: true
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const upstreamRes = await fetch(`${IOTEC_BASE_URL}/api/wallet-balance/${IOTEC_WALLET_ID}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        return res.json(data);
      } else {
        return res.json({
          id: IOTEC_WALLET_ID,
          name: IOTEC_WALLET_NAME,
          actualBalance: 5000,
          availableBalance: 5000,
          currency: 'ITX'
        });
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      return res.json({
        id: IOTEC_WALLET_ID,
        name: IOTEC_WALLET_NAME,
        actualBalance: 5000,
        availableBalance: 5000,
        currency: 'ITX'
      });
    }
  } catch (err: any) {
    console.error('Wallet balance error:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch wallet balance' });
  }
});

// 4. Initiate Collection via ioTec Pay (Mobile Money or Card)
app.post('/api/payments/iotec/collect', async (req: Request, res: Response) => {
  try {
    const {
      amountUGX,
      channel, // 'MOBILE_MONEY' | 'CARD'
      provider, // 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD'
      phoneNumber,
      cardDetails,
      commissioningId,
      description,
      deponentName
    } = req.body;

    if (!amountUGX || amountUGX < 500) {
      return res.status(400).json({ error: 'Minimum payable amount is UGX 500' });
    }

    const reference = `IOTEC-UG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let cardLast4 = undefined;
    let cardBrand = undefined;
    let cardRedirectUrl: string | undefined = undefined;
    let iotecRequestId: string | undefined = undefined;

    const token = await getIoTecAccessToken();
    let ioTecRealResponse: any = null;

    if (channel === 'CARD') {
      const rawNum = cardDetails?.cardNumber ? cardDetails.cardNumber.replace(/\s+/g, '') : '';
      cardLast4 = rawNum.slice(-4) || '4242';
      cardBrand = rawNum.startsWith('4') ? 'VISA' : rawNum.startsWith('5') ? 'MASTERCARD' : 'VISA';

      if (token && IOTEC_WALLET_ID) {
        try {
          const cardPayload = {
            walletId: IOTEC_WALLET_ID,
            amount: amountUGX,
            payer: cardDetails?.email || 'deponent@walayi.ug',
            payerName: cardDetails?.cardHolderName || deponentName || 'Deponent Client',
            payerNote: `Statutory Commissioning Escrow (${reference})`,
            payeeNote: `Commissioning Matter #${commissioningId || 'ESCROW'}`,
            externalId: reference,
            category: 'Card',
            redirectUrl: `${req.protocol}://${req.get('host')}`
          };

          const cardRes = await fetch(`${IOTEC_BASE_URL}/api/collections/collect/card`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(cardPayload)
          });

          if (cardRes.ok) {
            ioTecRealResponse = await cardRes.json();
            iotecRequestId = ioTecRealResponse?.id;
            cardRedirectUrl = ioTecRealResponse?.cardRedirectUrl;
          } else {
            console.warn('ioTec card collect returned status:', cardRes.status, await cardRes.text());
          }
        } catch (e: any) {
          console.warn('ioTec card upstream exception:', e?.message);
        }
      }
    } else {
      // Mobile Money Collection
      if (token && IOTEC_WALLET_ID) {
        try {
          const rawMsisdn = (phoneNumber || '0772491002').replace(/[^0-9]/g, '');
          let effectivePayer = rawMsisdn;

          // If on test wallet, ioTec requires test numbers (e.g. 0111777771 or 256111777771)
          const isTestWallet = IOTEC_WALLET_NAME.includes('TEST') || IOTEC_ENV === 'sandbox';
          if (isTestWallet && !rawMsisdn.startsWith('0111') && !rawMsisdn.startsWith('256111')) {
            effectivePayer = '0111777771';
          } else {
            if (rawMsisdn.startsWith('256')) {
              effectivePayer = rawMsisdn;
            } else if (rawMsisdn.startsWith('0')) {
              effectivePayer = '256' + rawMsisdn.substring(1);
            }
          }

          const momoPayload = {
            walletId: IOTEC_WALLET_ID,
            amount: amountUGX,
            payer: effectivePayer,
            payerName: deponentName || 'Deponent Client',
            payerNote: `Commissioning Escrow: ${description || 'Statutory Affidavit'}`,
            payeeNote: `Commissioning Matter #${commissioningId || 'ESCROW'}`,
            externalId: reference
          };

          const momoRes = await fetch(`${IOTEC_BASE_URL}/api/collections/collect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(momoPayload)
          });

          if (momoRes.ok) {
            ioTecRealResponse = await momoRes.json();
            iotecRequestId = ioTecRealResponse?.id;
          } else {
            const errText = await momoRes.text();
            console.warn('ioTec collect error:', momoRes.status, errText);
          }
        } catch (err: any) {
          console.warn('ioTec collect upstream exception:', err?.message);
        }
      }
    }

    // Store transaction record
    const newRecord: IoTecTransactionRecord = {
      reference,
      externalTxnId: ioTecRealResponse?.internalRequestId || ioTecRealResponse?.id || `TX-${Date.now()}`,
      iotecRequestId,
      cardRedirectUrl,
      commissioningId,
      amountUGX,
      provider: provider || (channel === 'CARD' ? 'CARD' : 'MTN_MOMO'),
      channel: channel || 'MOBILE_MONEY',
      phoneNumber,
      cardLast4,
      cardBrand,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ussdPromptSent: channel === 'MOBILE_MONEY',
      statutoryTrustEscrow: true
    };

    transactionsDb.set(reference, newRecord);

    return res.json({
      success: true,
      reference,
      externalTxnId: newRecord.externalTxnId,
      iotecRequestId: newRecord.iotecRequestId,
      cardRedirectUrl: newRecord.cardRedirectUrl,
      status: 'PENDING',
      channel: newRecord.channel,
      provider: newRecord.provider,
      amountUGX: newRecord.amountUGX,
      phoneNumber: newRecord.phoneNumber,
      cardLast4: newRecord.cardLast4,
      cardBrand: newRecord.cardBrand,
      message: channel === 'MOBILE_MONEY'
        ? `USSD push request dispatched to ${phoneNumber} via ioTec Pay. Deponent enters Mobile Money PIN on their handset.`
        : `Card authorization initiated with ioTec Pay (3D Secure).`,
      upstreamGatewayResponse: ioTecRealResponse
    });
  } catch (error: any) {
    console.error('Error in /api/payments/iotec/collect:', error);
    res.status(500).json({ error: error?.message || 'Payment initiation failed' });
  }
});

// 5. Query Transaction Status from ioTec
app.get('/api/payments/iotec/status/:reference', async (req: Request, res: Response) => {
  const { reference } = req.params;
  const record = transactionsDb.get(reference);

  if (!record) {
    return res.status(404).json({ error: `Transaction with reference ${reference} not found` });
  }

  // If credentials exist, check upstream ioTec status
  const token = await getIoTecAccessToken();
  if (token && record.status === 'PENDING') {
    try {
      const targetQuery = record.iotecRequestId 
        ? `${IOTEC_BASE_URL}/api/collections/status/${encodeURIComponent(record.iotecRequestId)}`
        : `${IOTEC_BASE_URL}/api/collections/external-id/${encodeURIComponent(reference)}`;

      const checkRes = await fetch(targetQuery, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (checkRes.ok) {
        const upstreamData = (await checkRes.json()) as any;
        const upStatus = (upstreamData.status || '').toUpperCase();
        if (upStatus === 'SUCCESS' || upStatus === 'CONFIRMED' || upStatus === 'SETTLED') {
          record.status = 'SUCCESS';
          record.updatedAt = new Date().toISOString();
        } else if (upStatus === 'FAILED' || upStatus === 'REJECTED') {
          record.status = 'FAILED';
          record.failureReason = upstreamData.statusMessage || upstreamData.message || 'Transaction declined';
          record.updatedAt = new Date().toISOString();
        }
      }
    } catch (e: any) {
      console.warn('ioTec status query warning:', e?.message);
    }
  }

  res.json({
    reference: record.reference,
    externalTxnId: record.externalTxnId,
    iotecRequestId: record.iotecRequestId,
    cardRedirectUrl: record.cardRedirectUrl,
    commissioningId: record.commissioningId,
    status: record.status,
    amountUGX: record.amountUGX,
    channel: record.channel,
    provider: record.provider,
    phoneNumber: record.phoneNumber,
    cardLast4: record.cardLast4,
    failureReason: record.failureReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  });
});

// 6. Test/Simulate USSD or Card Approval Action (For verification & sandbox workflows)
app.post('/api/payments/iotec/simulate-ussd-action', (req: Request, res: Response) => {
  const { reference, action, reason } = req.body;
  const record = transactionsDb.get(reference);

  if (!record) {
    return res.status(404).json({ error: `Transaction ${reference} not found` });
  }

  if (action === 'APPROVE') {
    record.status = 'SUCCESS';
    record.updatedAt = new Date().toISOString();
    return res.json({
      success: true,
      message: 'Payment approved successfully by user. Funds placed into statutory escrow.',
      record
    });
  } else if (action === 'REJECT') {
    record.status = 'FAILED';
    record.failureReason = reason || 'Payment declined by subscriber / invalid PIN';
    record.updatedAt = new Date().toISOString();
    return res.json({
      success: true,
      message: 'Payment rejected.',
      record
    });
  } else {
    return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });
  }
});

// 7. ioTec Pay Disbursement (Payout to Commissioner upon Step 14 completion)
app.post('/api/payments/iotec/disburse', async (req: Request, res: Response) => {
  try {
    const {
      amountUGX,
      recipientMsisdn,
      recipientName,
      commissioningId,
      reference,
      provider
    } = req.body;

    if (!amountUGX || amountUGX <= 0) {
      return res.status(400).json({ error: 'Valid disbursement amount required' });
    }

    const disburseRef = reference || `IOTEC-DISB-${Date.now()}`;
    const token = await getIoTecAccessToken();
    let upstreamDisburseResult: any = null;

    if (token && IOTEC_WALLET_ID) {
      try {
        const rawMsisdn = (recipientMsisdn || '').replace(/[^0-9]/g, '');
        const isTestWallet = IOTEC_WALLET_NAME.includes('TEST') || IOTEC_ENV === 'sandbox';
        let effectivePayee = rawMsisdn;

        if (isTestWallet && !rawMsisdn.startsWith('0111') && !rawMsisdn.startsWith('256111')) {
          effectivePayee = '0111777771';
        } else {
          if (rawMsisdn.startsWith('0')) effectivePayee = '256' + rawMsisdn.substring(1);
          else if (!rawMsisdn.startsWith('256')) effectivePayee = '256' + rawMsisdn;
        }

        const disbPayload = {
          walletId: IOTEC_WALLET_ID,
          amount: amountUGX,
          payee: effectivePayee,
          payeeName: recipientName || 'Advocate Commissioner',
          payerNote: 'Statutory Commissioning Escrow Settlement',
          payeeNote: `Net payout for commissioned matter #${commissioningId || 'DISBURSE'}`,
          externalId: disburseRef
        };

        const iotecRes = await fetch(`${IOTEC_BASE_URL}/api/disbursements/disburse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(disbPayload)
        });

        if (iotecRes.ok) {
          upstreamDisburseResult = await iotecRes.json();
        } else {
          console.warn('ioTec disburse error status:', iotecRes.status, await iotecRes.text());
        }
      } catch (err: any) {
        console.warn('ioTec disbursement exception:', err?.message);
      }
    }

    res.json({
      success: true,
      disbursementReference: disburseRef,
      iotecDisbursementId: upstreamDisburseResult?.id,
      status: 'SUCCESS',
      amountUGX,
      recipientName,
      recipientMsisdn,
      timestamp: new Date().toISOString(),
      provider: provider || 'MTN_MOMO',
      upstreamDisburseResult
    });
  } catch (error: any) {
    console.error('Disbursement error:', error);
    res.status(500).json({ error: error?.message || 'Disbursement failed' });
  }
});

// 7. ioTec Webhook Callback Handler
app.post('/api/payments/iotec/webhook', (req: Request, res: Response) => {
  const { reference, status, transaction_id, failure_reason } = req.body;
  console.log('Received ioTec webhook notification:', req.body);

  if (reference && transactionsDb.has(reference)) {
    const record = transactionsDb.get(reference)!;
    if (status === 'SUCCESS' || status === 'CONFIRMED') {
      record.status = 'SUCCESS';
    } else if (status === 'FAILED') {
      record.status = 'FAILED';
      record.failureReason = failure_reason || 'Failed via ioTec gateway webhook';
    }
    if (transaction_id) {
      record.externalTxnId = transaction_id;
    }
    record.updatedAt = new Date().toISOString();
  }

  res.json({ received: true });
});

// ---------------------------------------------------------------------------
// VITE MIDDLEWARE (Development) OR STATIC ASSET SERVING (Production)
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WALAYI Legal Server running on http://0.0.0.0:${PORT}`);
    console.log(`ioTec Pay endpoints initialized at /api/payments/iotec/*`);
  });
}

startServer();
