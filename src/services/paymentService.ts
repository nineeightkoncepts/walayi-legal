import { PaymentTransaction, CardPaymentDetails } from '../types';

export interface InitiatePaymentParams {
  userId: string;
  userName: string;
  phoneNumber?: string;
  cardDetails?: CardPaymentDetails;
  channel?: 'MOBILE_MONEY' | 'CARD' | 'WALLET';
  provider: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'IOTEC_PAY' | 'WALLET';
  serviceFeeUGX: number;
  platformFeePercentage?: number; // e.g. 5
  commissioningId?: string;
  purpose: 'COMMISSIONING_ESCROW' | 'PRO_SUBSCRIPTION' | 'PAYOUT_WITHDRAWAL' | 'COMMISSIONER_PAYOUT';
  description?: string;
}

export interface IoTecInitiateResponse {
  success: boolean;
  reference: string;
  externalTxnId: string;
  iotecRequestId?: string;
  cardRedirectUrl?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  channel: 'MOBILE_MONEY' | 'CARD';
  provider: string;
  amountUGX: number;
  phoneNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  message: string;
  upstreamGatewayResponse?: any;
}

export interface IoTecStatusResponse {
  reference: string;
  externalTxnId: string;
  iotecRequestId?: string;
  cardRedirectUrl?: string;
  commissioningId?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amountUGX: number;
  channel: 'MOBILE_MONEY' | 'CARD';
  provider: string;
  phoneNumber?: string;
  cardLast4?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IoTecConfigResponse {
  gateway: string;
  docsUrl: string;
  baseUrl: string;
  authUrl?: string;
  environment: string;
  isLiveConfigured: boolean;
  clientId?: string | null;
  walletId?: string;
  walletName?: string;
  testMsisdn?: string;
  supportedChannels: string[];
  supportedProviders: {
    mobileMoney: string[];
    cards: string[];
  };
  currency: string;
  statutoryEscrowGuaranteed: boolean;
}

export interface IoTecWalletBalance {
  id: string;
  name: string;
  actualBalance: number;
  availableBalance: number;
  currency: string;
  isMock?: boolean;
}

export const WALAYI_PLATFORM_FEE_UGX = 3800;

export class PaymentAdapter {
  static calculateFees(serviceFeeUGX: number, customPlatformFeeUGX: number = WALAYI_PLATFORM_FEE_UGX) {
    const platformFeeUGX = customPlatformFeeUGX;
    const totalAmountUGX = serviceFeeUGX + platformFeeUGX;
    return {
      serviceFeeUGX,
      platformFeeUGX,
      totalAmountUGX
    };
  }

  /**
   * Fetch live ioTec configuration from server backend
   */
  static async getIoTecConfig(): Promise<IoTecConfigResponse> {
    try {
      const res = await fetch('/api/payments/iotec/config');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Unable to load ioTec config from server, using fallback defaults:', e);
    }

    return {
      gateway: 'ioTec Pay',
      docsUrl: 'https://iotec.io/api-docs/pay',
      baseUrl: 'https://pay.iotec.io',
      environment: 'sandbox',
      isLiveConfigured: false,
      supportedChannels: ['MOBILE_MONEY', 'CARD'],
      supportedProviders: {
        mobileMoney: ['MTN_MOMO', 'AIRTEL_MONEY'],
        cards: ['VISA', 'MASTERCARD']
      },
      currency: 'UGX',
      statutoryEscrowGuaranteed: true
    };
  }

  /**
   * Fetch real-time wallet balance from ioTec
   */
  static async getWalletBalance(): Promise<IoTecWalletBalance> {
    try {
      const res = await fetch('/api/payments/iotec/wallet-balance');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Unable to query ioTec wallet balance:', e);
    }
    return {
      id: '01a07b2d-748c-7102-8264-3b44bdbe8e38',
      name: 'NINE EIGHT KONCEPTS TEST',
      actualBalance: 5000,
      availableBalance: 5000,
      currency: 'ITX',
      isMock: true
    };
  }

  /**
   * Initiate ioTec payment for Mobile Money or Card
   */
  static async initiateIoTecPayment(params: InitiatePaymentParams): Promise<{
    transaction: PaymentTransaction;
    iotecResult: IoTecInitiateResponse;
  }> {
    const platformFeeUGX = WALAYI_PLATFORM_FEE_UGX;
    const { totalAmountUGX } = this.calculateFees(params.serviceFeeUGX, platformFeeUGX);

    const isCard = params.provider === 'CARD' || params.channel === 'CARD';
    const effectiveChannel = isCard ? 'CARD' : 'MOBILE_MONEY';
    const effectiveProvider = isCard ? 'CARD' : (params.provider || 'MTN_MOMO');

    const res = await fetch('/api/payments/iotec/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amountUGX: totalAmountUGX,
        channel: effectiveChannel,
        provider: effectiveProvider,
        phoneNumber: params.phoneNumber,
        cardDetails: params.cardDetails,
        commissioningId: params.commissioningId,
        description: params.description || `WALAYI Statutory Escrow: ${params.userName}`
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Payment initialization failed' }));
      throw new Error(err.error || `ioTec HTTP error ${res.status}`);
    }

    const iotecResult: IoTecInitiateResponse = await res.json();

    const transaction: PaymentTransaction = {
      id: `TXN-IOTEC-${Date.now()}`,
      transactionRef: iotecResult.reference,
      commissioningId: params.commissioningId,
      userId: params.userId,
      userName: params.userName,
      provider: effectiveProvider,
      paymentChannel: effectiveChannel,
      phoneNumber: params.phoneNumber,
      cardLast4: iotecResult.cardLast4,
      cardBrand: iotecResult.cardBrand,
      gateway: 'IOTEC',
      type: params.purpose,
      amountUGX: totalAmountUGX,
      platformFeeUGX: platformFeeUGX,
      netPayoutUGX: params.serviceFeeUGX,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      externalProviderTxnId: iotecResult.externalTxnId,
      iotecReference: iotecResult.reference
    };

    return { transaction, iotecResult };
  }

  /**
   * Check status of an ioTec transaction by reference
   */
  static async checkStatus(reference: string): Promise<IoTecStatusResponse> {
    const res = await fetch(`/api/payments/iotec/status/${encodeURIComponent(reference)}`);
    if (!res.ok) {
      throw new Error(`Failed to query transaction status: ${res.status}`);
    }
    return await res.json();
  }

  /**
   * Poll status until resolved (SUCCESS or FAILED) or max attempts reached
   */
  static async pollUntilSettled(
    reference: string,
    onPoll?: (status: IoTecStatusResponse) => void,
    maxAttempts = 40,
    intervalMs = 2000
  ): Promise<IoTecStatusResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const status = await this.checkStatus(reference);
        if (onPoll) {
          onPoll(status);
        }
        if (status.status === 'SUCCESS' || status.status === 'FAILED') {
          return status;
        }
      } catch (err) {
        console.warn('Polling error attempt', attempts, err);
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Payment verification timed out. Please check with your mobile provider or refresh status.');
  }

  /**
   * Interactive USSD push simulation action (for testing / demo sandbox)
   */
  static async simulateUssdAction(reference: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<any> {
    const res = await fetch('/api/payments/iotec/simulate-ussd-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, action, reason })
    });
    if (!res.ok) {
      throw new Error('Failed to simulate USSD response');
    }
    return await res.json();
  }

  /**
   * Disburse payout from escrow to presiding commissioner upon Step 14 completion
   */
  static async disbursePayout(params: {
    amountUGX: number;
    recipientMsisdn: string;
    recipientName: string;
    commissioningId: string;
    provider?: 'MTN_MOMO' | 'AIRTEL_MONEY';
  }): Promise<{
    success: boolean;
    disbursementReference: string;
    transaction: PaymentTransaction;
  }> {
    // Payout settlement is handled off-platform; record it locally.
    const disbursementReference = `WY-PAYOUT-${Date.now()}`;

    const transaction: PaymentTransaction = {
      id: `TXN-PAYOUT-${Date.now()}`,
      transactionRef: disbursementReference,
      commissioningId: params.commissioningId,
      userId: params.recipientMsisdn,
      userName: params.recipientName,
      provider: params.provider || 'MTN_MOMO',
      paymentChannel: 'MOBILE_MONEY',
      phoneNumber: params.recipientMsisdn,
      gateway: 'DIRECT',
      type: 'COMMISSIONER_PAYOUT',
      amountUGX: params.amountUGX,
      platformFeeUGX: 0,
      netPayoutUGX: params.amountUGX,
      status: 'SETTLED',
      timestamp: new Date().toISOString(),
      externalProviderTxnId: disbursementReference
    };

    return {
      success: true,
      disbursementReference,
      transaction
    };
  }

  /**
   * Record an in-app payment locally (no external gateway).
   * Used by wallet top-ups, seal purchases, PRO subscriptions, etc.
   */
  static async initiateMomoPayment(params: InitiatePaymentParams): Promise<PaymentTransaction> {
    const platformFeeUGX = WALAYI_PLATFORM_FEE_UGX;
    const { totalAmountUGX } = this.calculateFees(params.serviceFeeUGX, platformFeeUGX);
    const reference = `WY-${Date.now()}`;

    const isCard = params.provider === 'CARD' || params.channel === 'CARD';

    const transaction: PaymentTransaction = {
      id: `TXN-${Date.now()}`,
      transactionRef: reference,
      commissioningId: params.commissioningId,
      userId: params.userId,
      userName: params.userName,
      provider: params.provider || 'WALLET',
      paymentChannel: isCard ? 'CARD' : (params.channel || 'WALLET'),
      phoneNumber: params.phoneNumber,
      gateway: 'DIRECT',
      type: params.purpose,
      amountUGX: totalAmountUGX,
      platformFeeUGX,
      netPayoutUGX: params.serviceFeeUGX,
      status: 'CONFIRMED',
      timestamp: new Date().toISOString(),
      externalProviderTxnId: reference
    };

    return transaction;
  }
}
