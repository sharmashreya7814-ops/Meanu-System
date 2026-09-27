import { Request, Response } from 'express';
import { repository } from '../db/repository.js';
import { ApiResponse, CreateExpenseDTO, Expense, UpdateExpenseDTO } from '../types/index.js';

export const getAdminExpenses = async (
  req: Request,
  res: Response<ApiResponse<Expense[]>>,
) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || (req.headers['x-restaurant-id'] as string);
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required restaurantId parameter',
      });
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const category = req.query.category as any | undefined;

    const expenses = await repository.getExpenses(restaurantId, {
      startDate,
      endDate,
      category,
    });

    return res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve expenses',
    });
  }
};

export const createAdminExpense = async (
  req: Request,
  res: Response<ApiResponse<Expense>>,
) => {
  try {
    const { restaurantId, category, description, amount, expenseDate, paymentMethod, notes } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'restaurantId is required',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'category is required',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'description is required',
      });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number greater than 0',
      });
    }

    const dto: CreateExpenseDTO = {
      restaurantId,
      category,
      description: description.trim(),
      amount: Number(Number(amount).toFixed(2)),
      expenseDate: expenseDate || new Date().toISOString(),
      paymentMethod: paymentMethod || 'CASH',
      notes: notes?.trim(),
    };

    const created = await repository.createExpense(dto);

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Expense recorded successfully',
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create expense',
    });
  }
};

export const updateAdminExpense = async (
  req: Request,
  res: Response<ApiResponse<Expense>>,
) => {
  try {
    const { id } = req.params;
    const restaurantId = (req.query.restaurantId as string) || (req.body.restaurantId as string) || (req.headers['x-restaurant-id'] as string);

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'restaurantId is required for multi-tenant isolation',
      });
    }

    const { category, description, amount, expenseDate, paymentMethod, notes } = req.body;

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number greater than 0',
      });
    }

    const dto: UpdateExpenseDTO = {
      category,
      description: description?.trim(),
      amount: amount !== undefined ? Number(Number(amount).toFixed(2)) : undefined,
      expenseDate,
      paymentMethod,
      notes: notes !== undefined ? notes.trim() : undefined,
    };

    const updated = await repository.updateExpense(restaurantId, id, dto);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Expense updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to update expense',
    });
  }
};

export const deleteAdminExpense = async (
  req: Request,
  res: Response<ApiResponse<{ id: string }>>,
) => {
  try {
    const { id } = req.params;
    const restaurantId = (req.query.restaurantId as string) || (req.headers['x-restaurant-id'] as string);

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'restaurantId is required for multi-tenant isolation',
      });
    }

    const deleted = await repository.deleteExpense(restaurantId, id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      data: { id },
      message: 'Expense deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete expense',
    });
  }
};
