export interface CreateOrderParams {
  amount: number; // in primary currency units (e.g. 420.00)
  currency: string; // e.g. "INR" or "USD"
  receipt: string; // e.g. "BILL-20260927-1048"
  notes?: Record<string, string>;
  customer?: {
    name: string;
    mobileNumber: string;
  };
}

export interface CreateOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  provider: string;
  raw?: any;
}

export interface VerifyParams {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface VerifyResult {
  isValid: boolean;
  failureReason?: string;
}

export interface WebhookResult {
  eventType: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  amount?: number;
  currency?: string;
  isPaid: boolean;
  raw?: any;
}

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createPaymentOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPaymentSignature(params: VerifyParams): Promise<VerifyResult>;
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): Promise<boolean>;
  parseWebhookEvent(body: any): Promise<WebhookResult | null>;
}
