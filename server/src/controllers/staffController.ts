import { Request, Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';
import { StaffRole } from '../types/index.js';

export async function getAdminStaffList(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.staffRestaurantId || (req.query.restaurantId as string) || 'rest-verde-01';
    const { role, search, isActive } = req.query;

    const staffList = await repository.getStaffByRestaurant(restaurantId, {
      role: role ? (role as StaffRole) : undefined,
      search: search as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    res.json({
      success: true,
      data: staffList,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminStaffById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const restaurantId = req.staffRestaurantId || (req.query.restaurantId as string);

    const staff = await repository.getStaffById(id, restaurantId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found',
      });
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, mobileNumber, password, role } = req.body;
    const restaurantId = req.staffRestaurantId || req.body.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'Restaurant ID is required' });
    }
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and role are required',
      });
    }

    const validRoles: StaffRole[] = ['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN', 'WAITER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role "${role}". Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const newStaff = await repository.createStaff({
      restaurantId,
      name,
      email,
      mobileNumber: mobileNumber || '',
      password,
      role,
    });

    res.status(201).json({
      success: true,
      data: newStaff,
      message: `Staff member "${newStaff.name}" created successfully as ${newStaff.role}`,
    });
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
}

export async function updateAdminStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const restaurantId = req.staffRestaurantId || req.body.restaurantId;
    const updates = req.body;
    const actorStaffId = req.staff?.id;
    const actorRole = req.staff?.role;

    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'Restaurant ID is required' });
    }

    const updated = await repository.updateStaff(id, restaurantId, updates, actorStaffId, actorRole);

    res.json({
      success: true,
      data: updated,
      message: `Staff member "${updated.name}" updated successfully`,
    });
  } catch (error: any) {
    if (error.message?.includes('Safety protection') || error.message?.includes('Privilege violation')) {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error.message?.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message?.includes('already used')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
}

export async function updateAdminStaffPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long',
      });
    }

    const success = await repository.updateStaffPassword(id, newPassword);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateAdminStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const restaurantId = req.staffRestaurantId || (req.query.restaurantId as string);
    const actorStaffId = req.staff?.id;

    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'Restaurant ID is required' });
    }

    const deactivated = await repository.deactivateStaff(id, restaurantId, actorStaffId);

    res.json({
      success: true,
      data: deactivated,
      message: `Staff member "${deactivated.name}" has been deactivated.`,
    });
  } catch (error: any) {
    if (error.message?.includes('Safety protection') || error.message?.includes('Privilege violation')) {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error.message?.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
}
