import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../payments/PaymentService.js';
import { repository } from '../db/repository.js';
import { PaymentStatus } from '../types/index.js';

/**
 * POST /api/restaurants/:slug/bills/:billNumber/payment
 * Creates or retrieves a payment order on the gateway with authoritative amounts.
 */
export async function createPaymentOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, billNumber } = req.params;

    const result = await paymentService.createPaymentOrder(slug, billNumber);

    res.status(200).json({
      success: true,
      data: result,
      message: result.isConfigured
        ? 'Payment order created successfully'
        : result.message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to initiate payment',
    });
  }
}

/**
 * POST /api/restaurants/:slug/bills/:billNumber/payment/verify
 * Validates cryptographic signature from checkout and atomically settles the bill.
 */
export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, billNumber } = req.params;
    const { paymentOrderId, paymentId, signature } = req.body;

    if (!paymentOrderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification parameters (paymentOrderId, paymentId, signature).',
      });
    }

    const result = await paymentService.verifyPayment(slug, billNumber, {
      paymentOrderId,
      paymentId,
      signature,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Payment verified and bill settled successfully!',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Payment verification failed',
    });
  }
}

/**
 * POST /api/payments/webhook
 * Processes asynchronous payment gateway webhooks securely.
 */
export async function handlePaymentWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = (req.headers['x-razorpay-signature'] || '') as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const result = await paymentService.handleWebhook(signature, rawBody, req.body);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    // Return 400 on signature failure without revealing internals
    res.status(400).json({
      success: false,
      error: error.message || 'Webhook processing failed',
    });
  }
}

/**
 * GET /api/admin/payments?restaurantId=...&status=...
 * Lists payments for restaurant administration and auditing.
 */
export async function getAdminPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId, status } = req.query;

    if (!restaurantId || typeof restaurantId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'restaurantId is required',
      });
    }

    const payments = await repository.getPaymentsByRestaurant(
      restaurantId,
      status ? (status as PaymentStatus) : undefined,
    );

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/restaurants/:slug/bills/:billNumber/upi-payment
 * Customer notifies server of direct UPI payment or submits UTR reference.
 */
export async function recordUpiPaymentAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, billNumber } = req.params;
    const { utrNumber, customerNotes } = req.body;

    const result = await repository.createUpiPaymentAttempt(slug, billNumber, utrNumber, customerNotes);

    res.status(200).json({
      success: true,
      data: result,
      message: utrNumber
        ? `UPI payment registered with UTR #${utrNumber}. Awaiting staff confirmation.`
        : 'UPI payment notification sent to staff. Verification in progress.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to record UPI payment attempt',
    });
  }
}

/**
 * POST /api/admin/bills/:billNumber/settle
 * Admin / Cashier settles a bill manually (UPI, CASH, CARD, etc.)
 */
export async function settleBillAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { billNumber } = req.params;
    const { restaurantId, method = 'UPI_QR', referenceId, notes } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'restaurantId is required',
      });
    }

    const result = await repository.settleBillManually(
      restaurantId,
      billNumber,
      method,
      referenceId,
      notes,
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `Bill #${billNumber} settled successfully via ${method}`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to settle bill',
    });
  }
}

/**
 * POST /api/admin/payments/:paymentId/verify
 * Admin / Cashier verifies a specific pending payment attempt (e.g. UPI with UTR)
 */
export async function verifyPaymentAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { paymentId } = req.params;
    const { referenceId } = req.body;

    const payment = await repository.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found',
      });
    }

    const result = await repository.settleBillWithPayment(
      payment.billId,
      payment.id,
      referenceId || payment.providerPaymentId || `UPI-VERIFIED-${Date.now()}`,
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Payment verified and settled successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify payment',
    });
  }
}
