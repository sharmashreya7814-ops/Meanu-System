import { Request, Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';
import { CurrentUserResponse, StaffAuthResponse } from '../types/index.js';
import { generateAuthToken, verifyPassword } from '../utils/crypto.js';
import { getPermissionsForRole } from '../utils/rbac.js';

export async function loginStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password, restaurantId } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Identifier (email or mobile) and password are required',
      });
    }

    const staffEntity = await repository.getStaffEntityByIdentifier(identifier, restaurantId);
    if (!staffEntity) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password hash
    const isValid = verifyPassword(password, staffEntity.passwordHash, staffEntity.passwordSalt);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check active status
    if (!staffEntity.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your staff account is currently deactivated. Please contact the restaurant owner.',
      });
    }

    // Update login timestamp
    await repository.updateStaffLastLogin(staffEntity.id);

    const token = generateAuthToken(staffEntity.id, staffEntity.restaurantId);
    const permissions = getPermissionsForRole(staffEntity.role);
    const restaurant = await repository.getRestaurantById(staffEntity.restaurantId);

    const { passwordHash, passwordSalt, ...user } = staffEntity;

    const responseData: StaffAuthResponse = {
      user: {
        ...user,
        lastLoginAt: new Date().toISOString(),
      },
      token,
      permissions,
      restaurant: restaurant!,
    };

    res.json({
      success: true,
      data: responseData,
      message: `Welcome back, ${user.name}! Signed in as ${user.role}.`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.staff) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Not authenticated',
      });
    }

    const restaurant = await repository.getRestaurantById(req.staff.restaurantId);
    const permissions = getPermissionsForRole(req.staff.role);

    const data: CurrentUserResponse = {
      id: req.staff.id,
      name: req.staff.name,
      email: req.staff.email,
      mobileNumber: req.staff.mobileNumber,
      role: req.staff.role,
      restaurantId: req.staff.restaurantId,
      permissions,
      isActive: req.staff.isActive,
      lastLoginAt: req.staff.lastLoginAt,
      restaurant: restaurant || undefined,
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutStaff(_req: Request, res: Response) {
  res.json({
    success: true,
    message: 'Staff session closed successfully',
  });
}
