import crypto from 'crypto';
import {
  CreateOrderParams,
  CreateOrderResult,
  PaymentProvider,
  VerifyParams,
  VerifyResult,
  WebhookResult,
} from '../PaymentProvider.js';

export class RazorpayProvider implements PaymentProvider {
  readonly name = 'RAZORPAY';

  private keyId: string | undefined;
  private keySecret: string | undefined;
  private webhookSecret: string | undefined;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  }

  public isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }

  public getKeyId(): string | undefined {
    return this.keyId;
  }

  public async createPaymentOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured.');
    }

    // In Razorpay, amount is passed in smallest currency subunit (e.g. paise for INR)
    const amountInSubunits = Math.round(params.amount * 100);

    try {
      // Call Razorpay API using standard fetch
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: amountInSubunits,
          currency: params.currency || 'INR',
          receipt: params.receipt.slice(0, 40),
          notes: params.notes || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.description || `Razorpay order creation failed (${response.status})`);
      }

      const orderData = await response.json();

      return {
        provider: this.name,
        providerOrderId: orderData.id,
        amount: params.amount,
        currency: params.currency,
        keyId: this.keyId,
        raw: orderData,
      };
    } catch (err: any) {
      // If network/API error occurs, propagate safe error
      throw new Error(err.message || 'Failed to initialize payment gateway order');
    }
  }

  public async verifyPaymentSignature(params: VerifyParams): Promise<VerifyResult> {
    if (!this.keySecret) {
      return {
        isValid: false,
        failureReason: 'Razorpay secret key is not configured on the server.',
      };
    }

    if (!params.providerOrderId || !params.providerPaymentId || !params.signature) {
      return {
        isValid: false,
        failureReason: 'Missing payment signature verification parameters.',
      };
    }

    try {
      const payload = `${params.providerOrderId}|${params.providerPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const actualBuffer = Buffer.from(params.signature, 'utf8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return {
          isValid: false,
          failureReason: 'Signature mismatch: Invalid authentication token length.',
        };
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, actualBuffer);
      return {
        isValid,
        failureReason: isValid ? undefined : 'Payment signature verification failed.',
      };
    } catch (err: any) {
      return {
        isValid: false,
        failureReason: err.message || 'Error occurred during signature verification.',
      };
    }
  }

  public async verifyWebhookSignature(
    rawBody: string | Buffer,
    signatureHeader: string,
  ): Promise<boolean> {
    if (!this.webhookSecret || !signatureHeader) {
      return false;
    }

    try {
      const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(bodyString)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const actualBuffer = Buffer.from(signatureHeader, 'utf8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  public async parseWebhookEvent(body: any): Promise<WebhookResult | null> {
    if (!body || !body.event) return null;

    const eventType = body.event;
    const paymentEntity = body.payload?.payment?.entity;
    const orderEntity = body.payload?.order?.entity;

    const isPaid = eventType === 'payment.captured' || eventType === 'order.paid';
    const amount = paymentEntity?.amount ? paymentEntity.amount / 100 : undefined;

    return {
      eventType,
      providerOrderId: paymentEntity?.order_id || orderEntity?.id,
      providerPaymentId: paymentEntity?.id,
      amount,
      currency: paymentEntity?.currency || 'INR',
      isPaid,
      raw: body,
    };
  }
}
