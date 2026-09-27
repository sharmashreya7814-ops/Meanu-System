import { Request, Response } from 'express';
import { repository } from '../db/repository.js';
import {
  ApiResponse,
  CreateIngredientDTO,
  CreatePurchaseDTO,
  CreateRecipeDTO,
  CreateStockAdjustmentDTO,
  CreateStockCountDTO,
  CreateSupplierDTO,
  CreateWastageDTO,
  Ingredient,
  IngredientCategory,
  InventoryDashboardResponse,
  Purchase,
  Recipe,
  StockMovement,
  StockMovementType,
  StockStatus,
  Supplier,
  UpdateIngredientDTO,
  UpdateRecipeDTO,
  UpdateSupplierDTO,
  WastageReason,
  WastageRecord,
} from '../types/index.js';

// === INGREDIENTS ===
export const getAdminIngredients = async (
  req: Request,
  res: Response<ApiResponse<Ingredient[]>>,
) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const data = await repository.getIngredients(restaurantId, {
      category,
      status,
      search,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch ingredients' });
  }
};

export const createAdminIngredient = async (
  req: Request,
  res: Response<ApiResponse<Ingredient>>,
) => {
  try {
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: CreateIngredientDTO = req.body;
    if (!dto.name || !dto.unit || !dto.category) {
      return res.status(400).json({
        success: false,
        error: 'name, unit, and category are required fields',
      });
    }

    const data = await repository.createIngredient(restaurantId, dto);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create ingredient' });
  }
};

export const updateAdminIngredient = async (
  req: Request,
  res: Response<ApiResponse<Ingredient>>,
) => {
  try {
    const id = req.params.id;
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: UpdateIngredientDTO = req.body;
    const data = await repository.updateIngredient(id, restaurantId, dto);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Ingredient not found' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update ingredient' });
  }
};

export const deleteAdminIngredient = async (
  req: Request,
  res: Response<ApiResponse<{ id: string }>>,
) => {
  try {
    const id = req.params.id;
    const restaurantId = (req.query.restaurantId || req.body.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const success = await repository.deleteIngredient(id, restaurantId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Ingredient not found' });
    }

    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete ingredient' });
  }
};

// === RECIPES ===
export const getAdminRecipes = async (
  req: Request,
  res: Response<ApiResponse<Recipe[]>>,
) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const menuItemId = req.query.menuItemId as string | undefined;
    const data = await repository.getRecipes(restaurantId, menuItemId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch recipes' });
  }
};

export const getAdminRecipeById = async (
  req: Request,
  res: Response<ApiResponse<Recipe>>,
) => {
  try {
    const id = req.params.id;
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const data = await repository.getRecipeById(id, restaurantId);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch recipe' });
  }
};

export const createAdminRecipe = async (
  req: Request,
  res: Response<ApiResponse<Recipe>>,
) => {
  try {
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: CreateRecipeDTO = req.body;
    if (!dto.menuItemId || !dto.ingredients || dto.ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'menuItemId and at least one ingredient are required',
      });
    }

    const data = await repository.createRecipe(restaurantId, dto);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create recipe' });
  }
};

export const updateAdminRecipe = async (
  req: Request,
  res: Response<ApiResponse<Recipe>>,
) => {
  try {
    const id = req.params.id;
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: UpdateRecipeDTO = req.body;
    const data = await repository.updateRecipe(id, restaurantId, dto);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update recipe' });
  }
};

export const deleteAdminRecipe = async (
  req: Request,
  res: Response<ApiResponse<{ id: string }>>,
) => {
  try {
    const id = req.params.id;
    const restaurantId = (req.query.restaurantId || req.body.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const success = await repository.deleteRecipe(id, restaurantId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete recipe' });
  }
};

export const syncAdminRecipeCost = async (
  req: Request,
  res: Response<ApiResponse<any>>,
) => {
  try {
    const id = req.params.id;
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const data = await repository.syncRecipeCostToMenuItem(id, restaurantId);
    res.json({ success: true, data, message: 'Menu item costPrice updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to sync recipe cost' });
  }
};

// === SUPPLIERS ===
export const getAdminSuppliers = async (
  req: Request,
  res: Response<ApiResponse<Supplier[]>>,
) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const data = await repository.getSuppliers(restaurantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch suppliers' });
  }
};

export const createAdminSupplier = async (
  req: Request,
  res: Response<ApiResponse<Supplier>>,
) => {
  try {
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: CreateSupplierDTO = req.body;
    if (!dto.name) {
      return res.status(400).json({ success: false, error: 'Supplier name is required' });
    }

    const data = await repository.createSupplier(restaurantId, dto);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create supplier' });
  }
};

export const updateAdminSupplier = async (
  req: Request,
  res: Response<ApiResponse<Supplier>>,
) => {
  try {
    const id = req.params.id;
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: UpdateSupplierDTO = req.body;
    const data = await repository.updateSupplier(id, restaurantId, dto);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update supplier' });
  }
};

export const deleteAdminSupplier = async (
  req: Request,
  res: Response<ApiResponse<{ id: string }>>,
) => {
  try {
    const id = req.params.id;
    const restaurantId = (req.query.restaurantId || req.body.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const success = await repository.deleteSupplier(id, restaurantId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete supplier' });
  }
};

// === PURCHASES ===
export const getAdminPurchases = async (
  req: Request,
  res: Response<ApiResponse<Purchase[]>>,
) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const supplierId = req.query.supplierId as string | undefined;

    const data = await repository.getPurchases(restaurantId, {
      startDate,
      endDate,
      supplierId,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch purchases' });
  }
};

export const createAdminPurchase = async (
  req: Request,
  res: Response<ApiResponse<Purchase>>,
) => {
  try {
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: CreatePurchaseDTO = req.body;
    if (!dto.items || dto.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Purchase must have at least one line item',
      });
    }

    const data = await repository.createPurchase(restaurantId, dto);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create purchase' });
  }
};

// === STOCK MOVEMENTS & ADJUSTMENTS ===
export const getAdminStockMovements = async (
  req: Request,
  res: Response<ApiResponse<StockMovement[]>>,
) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const ingredientId = req.query.ingredientId as string | undefined;
    const type = req.query.type as StockMovementType | 'ALL' | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const data = await repository.getStockMovements(restaurantId, {
      ingredientId,
      type,
      startDate,
      endDate,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch stock movements' });
  }
};

export const createAdminStockAdjustment = async (
  req: Request,
  res: Response<ApiResponse<StockMovement>>,
) => {
  try {
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: CreateStockAdjustmentDTO = req.body;
    if (!dto.ingredientId || !dto.adjustmentType || !dto.quantity) {
      return res.status(400).json({
        success: false,
        error: 'ingredientId, adjustmentType, and quantity are required',
      });
    }

    const data = await repository.createStockAdjustment(restaurantId, dto);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create adjustment' });
  }
};

export const reconcileAdminStockCount = async (
  req: Request,
  res: Response<ApiResponse<any>>,
) => {
  try {
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: CreateStockCountDTO = req.body;
    if (!dto.ingredientId || dto.physicalStock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'ingredientId and physicalStock are required',
      });
    }

    const data = await repository.reconcileStockCount(restaurantId, dto);
    res.json({ success: true, data, message: 'Physical stock reconciled successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to reconcile stock count' });
  }
};

// === WASTAGE ===
export const getAdminWastage = async (
  req: Request,
  res: Response<ApiResponse<WastageRecord[]>>,
) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const reason = req.query.reason as WastageReason | 'ALL' | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const data = await repository.getWastageRecords(restaurantId, {
      reason,
      startDate,
      endDate,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch wastage records' });
  }
};

export const createAdminWastage = async (
  req: Request,
  res: Response<ApiResponse<WastageRecord>>,
) => {
  try {
    const restaurantId = (req.body.restaurantId || req.query.restaurantId) as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const dto: CreateWastageDTO = req.body;
    if (!dto.ingredientId || !dto.quantity || !dto.reason) {
      return res.status(400).json({
        success: false,
        error: 'ingredientId, quantity, and reason are required',
      });
    }

    const data = await repository.createWastage(restaurantId, dto);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to record wastage' });
  }
};

// === INVENTORY DASHBOARD ===
export const getAdminInventoryDashboard = async (
  req: Request,
  res: Response<ApiResponse<InventoryDashboardResponse>>,
) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'restaurantId is required' });
    }

    const data = await repository.getInventoryDashboard(restaurantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch inventory dashboard' });
  }
};
