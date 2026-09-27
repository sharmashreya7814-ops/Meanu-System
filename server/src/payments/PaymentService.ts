import { repository } from '../db/repository.js';
import { Bill, Payment, VerifyPaymentDTO } from '../types/index.js';
import { PaymentProvider } from './PaymentProvider.js';
import { RazorpayProvider } from './providers/RazorpayProvider.js';

export class PaymentService {
  private provider: PaymentProvider;

  constructor(provider?: PaymentProvider) {
    this.provider = provider || new RazorpayProvider();
  }

  public getProvider(): PaymentProvider {
    return this.provider;
  }

  public isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  /**
   * Initializes a payment order for a bill.
   * Authoritative amount comes strictly from PostgreSQL / database bill record.
   */
  public async createPaymentOrder(restaurantSlug: string, billNumber: string) {
    const restaurant = await repository.getRestaurantBySlug(restaurantSlug);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const bill = await repository.getBillByNumber(restaurant.id, billNumber);
    if (!bill) {
      throw new Error('Bill not found');
    }

    if (bill.paymentStatus === 'PAID') {
      throw new Error('This bill has already been settled and paid.');
    }

    // Authoritative amount directly from database
    const authoritativeAmount = bill.totalAmount;
    const currency = restaurant.currency || bill.currency || 'INR';

    // Check if live payment gateway credentials are provided
    if (!this.provider.isConfigured()) {
      // Create a local tracking payment attempt record
      const paymentAttempt = await repository.createPayment({
        restaurantId: restaurant.id,
        billId: bill.id,
        orderId: bill.orderId,
        provider: this.provider.name,
        amount: authoritativeAmount,
        currency,
        status: 'CREATED',
        failureReason: 'Live payment gateway credentials not configured on server',
      });

      return {
        isConfigured: false,
        provider: this.provider.name,
        paymentId: paymentAttempt.id,
        billNumber: bill.billNumber,
        restaurantName: restaurant.name,
        amount: authoritativeAmount,
        currency,
        message: 'Online payment integration implemented but live gateway credentials pending configuration.',
      };
    }

    // Initialize real order on Razorpay
    const orderResult = await this.provider.createPaymentOrder({
      amount: authoritativeAmount,
      currency,
      receipt: bill.billNumber,
      notes: {
        restaurantSlug,
        billNumber: bill.billNumber,
        tableNumber: bill.table?.tableNumber || '',
      },
      customer: bill.customer
        ? {
            name: bill.customer.name,
            mobileNumber: bill.customer.mobileNumber,
          }
        : undefined,
    });

    // Store payment attempt record
    const payment = await repository.createPayment({
      restaurantId: restaurant.id,
      billId: bill.id,
      orderId: bill.orderId,
      provider: this.provider.name,
      providerOrderId: orderResult.providerOrderId,
      amount: authoritativeAmount,
      currency,
      status: 'PENDING',
    });

    return {
      isConfigured: true,
      provider: this.provider.name,
      paymentId: payment.id,
      providerOrderId: orderResult.providerOrderId,
      amount: authoritativeAmount,
      currency,
      keyId: orderResult.keyId,
      billNumber: bill.billNumber,
      restaurantName: restaurant.name,
      description: `Table ${bill.table?.tableNumber || ''} Bill #${bill.billNumber}`,
      prefill: {
        name: bill.customer?.name,
        contact: bill.customer?.mobileNumber,
      },
      notes: {
        billId: bill.id,
        restaurantId: restaurant.id,
      },
    };
  }

  /**
   * Cryptographically verifies payment signature received from client.
   * If valid, atomically settles both Payment and Bill.
   */
  public async verifyPayment(
    restaurantSlug: string,
    billNumber: string,
    verificationData: VerifyPaymentDTO,
  ): Promise<{ success: boolean; bill: Bill; payment: Payment }> {
    const restaurant = await repository.getRestaurantBySlug(restaurantSlug);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const bill = await repository.getBillByNumber(restaurant.id, billNumber);
    if (!bill) {
      throw new Error('Bill not found');
    }

    // Idempotency: If bill is already marked PAID, return existing settled state
    if (bill.paymentStatus === 'PAID') {
      const existingPayments = await repository.getPaymentsByBillId(bill.id);
      const paidPayment = existingPayments.find((p) => p.status === 'PAID') || existingPayments[0];
      return {
        success: true,
        bill,
        payment: paidPayment,
      };
    }

    // Find the corresponding payment attempt
    let payment = await repository.getPaymentByProviderOrderId(verificationData.paymentOrderId);
    if (!payment) {
      const billPayments = await repository.getPaymentsByBillId(bill.id);
      payment = billPayments[0] || null;
    }

    if (!payment) {
      throw new Error('Payment attempt record not found for this bill.');
    }

    // Signature verification with server secret
    const verifyResult = await this.provider.verifyPaymentSignature({
      providerOrderId: verificationData.paymentOrderId,
      providerPaymentId: verificationData.paymentId,
      signature: verificationData.signature,
    });

    if (!verifyResult.isValid) {
      // Record payment failure safely
      await repository.updatePaymentStatus(payment.id, 'FAILED', {
        providerPaymentId: verificationData.paymentId,
        failureReason: verifyResult.failureReason || 'Cryptographic signature verification failed',
      });
      throw new Error(verifyResult.failureReason || 'Payment verification failed. Invalid signature.');
    }

    // Atomic settlement transaction
    const settled = await repository.settleBillWithPayment(
      bill.id,
      payment.id,
      verificationData.paymentId,
    );

    return {
      success: true,
      bill: settled.bill,
      payment: settled.payment,
    };
  }

  /**
   * Processes gateway webhooks with cryptographic validation and idempotency.
   */
  public async handleWebhook(
    signatureHeader: string,
    rawBody: string | Buffer,
    body: any,
  ): Promise<{ processed: boolean; message: string; eventType?: string }> {
    const isSignatureValid = await this.provider.verifyWebhookSignature(rawBody, signatureHeader);
    if (!isSignatureValid) {
      throw new Error('Invalid webhook signature');
    }

    const event = await this.provider.parseWebhookEvent(body);
    if (!event || !event.providerOrderId) {
      return { processed: false, message: 'Unrecognized event format or missing order ID' };
    }

    // Find payment attempt
    const payment = await repository.getPaymentByProviderOrderId(event.providerOrderId);
    if (!payment) {
      return { processed: false, message: 'No matching payment order found for webhook' };
    }

    // Idempotency: Check if already settled
    if (payment.status === 'PAID') {
      return { processed: true, message: 'Payment already settled previously (idempotent)', eventType: event.eventType };
    }

    if (event.isPaid && event.providerPaymentId) {
      await repository.settleBillWithPayment(payment.billId, payment.id, event.providerPaymentId);
      return { processed: true, message: 'Payment and bill successfully settled via webhook', eventType: event.eventType };
    } else if (event.eventType === 'payment.failed') {
      await repository.updatePaymentStatus(payment.id, 'FAILED', {
        providerPaymentId: event.providerPaymentId,
        failureReason: 'Payment failed on gateway side',
      });
      return { processed: true, message: 'Payment marked as failed via webhook', eventType: event.eventType };
    }

    return { processed: true, message: 'Webhook event recorded', eventType: event.eventType };
  }
}

export const paymentService = new PaymentService();
