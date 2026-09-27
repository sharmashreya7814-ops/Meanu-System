import { Request, Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';
import { StaffPermission, StaffRole, StaffUser } from '../types/index.js';
import { verifyAuthToken } from '../utils/crypto.js';
import { hasAnyPermission, hasPermission } from '../utils/rbac.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      staff?: StaffUser;
      staffRole?: StaffRole;
      staffRestaurantId?: string;
    }
  }
}

/**
 * Middleware that authenticates a staff user from Bearer token, header, or query
 */
export async function authenticateStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const tokenHeader = req.headers['x-staff-token'] as string;
    const devStaffId = req.headers['x-staff-id'] as string;
    const devRole = req.headers['x-staff-role'] as string;
    const queryToken = req.query.token as string;
    const requestedRestaurantId = (req.query.restaurantId as string) || (req.body?.restaurantId as string);

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (tokenHeader) {
      token = tokenHeader;
    } else if (queryToken) {
      token = queryToken;
    }

    let staffEntity = null;

    if (token) {
      const decoded = verifyAuthToken(token);
      if (decoded) {
        staffEntity = await repository.getStaffEntityById(decoded.staffId);
      }
    } else if (devStaffId) {
      staffEntity = await repository.getStaffEntityById(devStaffId);
    } else if (devRole && requestedRestaurantId) {
      // Fallback helper for role testing if explicit dev role header is sent
      const staffList = await repository.getStaffEntitiesByRestaurant(requestedRestaurantId);
      staffEntity = staffList.find((s) => s.role === devRole && s.isActive);
    }

    if (staffEntity) {
      if (!staffEntity.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Staff account is deactivated',
        });
      }

      const { passwordHash, passwordSalt, ...sanitized } = staffEntity;
      req.staff = sanitized;
      req.staffRole = sanitized.role;
      req.staffRestaurantId = sanitized.restaurantId;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that requires a valid authenticated staff user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.staff) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required',
    });
  }
  if (!req.staff.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Staff account is inactive',
    });
  }
  next();
}

/**
 * Middleware that enforces a specific permission and tenant isolation
 */
export function requirePermission(permission: StaffPermission | StaffPermission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure authenticated
    if (!req.staff) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
    }

    if (!req.staff.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Staff account is inactive',
      });
    }

    // 2. Check RBAC permission
    const requiredList = Array.isArray(permission) ? permission : [permission];
    const userRole = req.staff.role;

    const permitted = hasAnyPermission(userRole, requiredList);
    if (!permitted) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Insufficient permissions (requires: ${requiredList.join(' or ')})`,
        role: userRole,
      });
    }

    // 3. Multi-tenant isolation enforcement
    const targetRestaurantId =
      (req.query.restaurantId as string) ||
      (req.body?.restaurantId as string) ||
      (req.params.restaurantId as string);

    if (targetRestaurantId && targetRestaurantId !== req.staff.restaurantId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cross-restaurant access is not permitted',
      });
    }

    const slug = req.params.slug;
    if (slug) {
      const rest = await repository.getRestaurantBySlug(slug);
      if (rest && rest.id !== req.staff.restaurantId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cross-restaurant access is not permitted',
        });
      }
    }

    next();
  };
}
