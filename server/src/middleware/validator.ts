import { Request, Response, NextFunction } from 'express';

export function sanitizeInput(str: any): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Validates Indian Mobile Number format:
 * Accepts formats:
 * - 9876543210
 * - +91 9876543210
 * - +91-9876543210
 * - 09876543210
 * - 919876543210
 */
export function isValidIndianMobileNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Clean non-digits except initial +
  const cleanDigits = phone.replace(/[\s\-\(\)]/g, '');
  // Indian mobile regex: optional +91, 91, or 0 followed by 10 digits starting with 6, 7, 8, or 9
  const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return indianPhoneRegex.test(cleanDigits);
}

export function validateCustomerSession(req: Request, res: Response, next: NextFunction) {
  const { name, mobileNumber, tableId } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid name (at least 2 characters)',
    });
  }

  if (!mobileNumber || typeof mobileNumber !== 'string' || !isValidIndianMobileNumber(mobileNumber)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 98765 43210)',
    });
  }

  if (!tableId || typeof tableId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Table ID is required to start a customer session',
    });
  }

  req.body.name = sanitizeInput(name);
  req.body.mobileNumber = sanitizeInput(mobileNumber);
  req.body.tableId = sanitizeInput(tableId);

  next();
}

export function validateOrderCreation(req: Request, res: Response, next: NextFunction) {
  const { tableId, customerId, items } = req.body;

  if (!tableId || typeof tableId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Table ID is required',
    });
  }

  if (!customerId || typeof customerId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Customer session ID is required',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Order must contain at least one item',
    });
  }

  for (let i = 0; i < items.length; i++) {
    const itm = items[i];
    if (!itm.menuItemId || typeof itm.menuItemId !== 'string') {
      return res.status(400).json({
        success: false,
        error: `Item at index ${i} is missing valid menuItemId`,
      });
    }
    if (!Number.isInteger(itm.quantity) || itm.quantity < 1 || itm.quantity > 50) {
      return res.status(400).json({
        success: false,
        error: `Item at index ${i} has invalid quantity (must be 1-50)`,
      });
    }
    if (itm.specialInstructions) {
      itm.specialInstructions = sanitizeInput(itm.specialInstructions).substring(0, 200);
    }
  }

  if (req.body.specialInstructions) {
    req.body.specialInstructions = sanitizeInput(req.body.specialInstructions).substring(0, 400);
  }

  next();
}
