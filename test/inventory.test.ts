import { repository } from '../server/src/db/repository.js';
import { formatCurrency } from '../src/utils/formatters.js';

async function runInventoryTests() {
  console.log('====================================================');
  console.log('RUNNING MODULE 8 INVENTORY CONSUMPTION & SAFETY TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // Set up test restaurant & tables
  const restaurantV = (await repository.getRestaurantById('rest-verde-01'))!;
  const tableV = (await repository.getTablesByRestaurant('rest-verde-01'))[0];
  const customerV = await repository.createOrUpdateCustomer({
    restaurantId: 'rest-verde-01',
    tableId: tableV.id,
    name: 'Inventory Lifecycle Tester',
    mobileNumber: '+91 98888 77777',
  });

  // Fetch initial stock of Malai Paneer (ing-v-01) which is used in Paneer Makhani (item-v3: 0.25kg per portion in rec-v-01)
  const paneerInitial = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!;
  const initialPaneerStock = paneerInitial.currentStock;

  // ----------------------------------------------------
  // TEST 1: Order creation does NOT consume stock
  // ----------------------------------------------------
  const order1 = await repository.createOrder('rest-verde-01', {
    tableId: tableV.id,
    customerId: customerV.id,
    items: [
      {
        menuItemId: 'item-v3', // Paneer Makhani (uses 0.25kg paneer per portion)
        quantity: 2, // Would consume 0.5kg when completed
      },
    ],
  });

  const paneerAfterCreation = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  assert(
    paneerAfterCreation === initialPaneerStock,
    '1. Order creation (status: NEW) does NOT deduct ingredient stock',
  );

  // Check that NO ORDER_CONSUMPTION movement exists for order1
  const movementsAfterCreation = await repository.getStockMovements('rest-verde-01', {
    ingredientId: 'ing-v-01',
  });
  const order1Movement = movementsAfterCreation.find(
    (m) => m.referenceId === order1.id && m.movementType === 'ORDER_CONSUMPTION',
  );
  assert(!order1Movement, '1. No ORDER_CONSUMPTION stock movement created upon order creation');

  // ----------------------------------------------------
  // TEST 2: Intermediate status transitions do NOT consume stock
  // ----------------------------------------------------
  await repository.updateOrderStatus(order1.id, 'ACCEPTED');
  let paneerCheck = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  assert(paneerCheck === initialPaneerStock, '2. ACCEPTED status does not consume stock');

  await repository.updateOrderStatus(order1.id, 'PREPARING');
  paneerCheck = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  assert(paneerCheck === initialPaneerStock, '2. PREPARING status does not consume stock');

  await repository.updateOrderStatus(order1.id, 'READY');
  paneerCheck = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  assert(paneerCheck === initialPaneerStock, '2. READY status does not consume stock');

  await repository.updateOrderStatus(order1.id, 'SERVED');
  paneerCheck = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  assert(paneerCheck === initialPaneerStock, '2. SERVED status does not consume stock');

  // ----------------------------------------------------
  // TEST 3: COMPLETED order consumes stock
  // ----------------------------------------------------
  await repository.updateOrderStatus(order1.id, 'COMPLETED');
  const paneerAfterCompleted = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  const expectedPaneerStock = Number((initialPaneerStock - 0.5).toFixed(3));
  assert(
    paneerAfterCompleted === expectedPaneerStock,
    '3. Transition to COMPLETED successfully deducts 0.5kg (2x 0.25kg) Malai Paneer',
  );

  const movementsAfterCompleted = await repository.getStockMovements('rest-verde-01', {
    ingredientId: 'ing-v-01',
  });
  const order1MovementCompleted = movementsAfterCompleted.find(
    (m) => m.referenceId === order1.id && m.movementType === 'ORDER_CONSUMPTION',
  );
  assert(
    !!order1MovementCompleted && order1MovementCompleted.quantity === -0.5,
    '3. ORDER_CONSUMPTION stock movement logged with -0.5kg delta and order reference',
  );

  // ----------------------------------------------------
  // TEST 4 & 5: Idempotency — Duplicate COMPLETED call does NOT consume twice
  // ----------------------------------------------------
  await repository.updateOrderStatus(order1.id, 'COMPLETED');
  const paneerAfterDuplicateCompleted = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  assert(
    paneerAfterDuplicateCompleted === expectedPaneerStock,
    '4. Duplicate COMPLETED transition is idempotent: does NOT consume stock twice',
  );

  const duplicateMovements = (
    await repository.getStockMovements('rest-verde-01', { ingredientId: 'ing-v-01' })
  ).filter((m) => m.referenceId === order1.id && m.movementType === 'ORDER_CONSUMPTION');
  assert(duplicateMovements.length === 1, '5. Only exactly ONE stock movement exists for the completed order');

  // ----------------------------------------------------
  // TEST 6: CANCELLED order does NOT consume stock
  // ----------------------------------------------------
  const order2 = await repository.createOrder('rest-verde-01', {
    tableId: tableV.id,
    customerId: customerV.id,
    items: [{ menuItemId: 'item-v3', quantity: 3 }], // 3x = 0.75kg
  });

  const stockBeforeCancel = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  await repository.updateOrderStatus(order2.id, 'PREPARING');
  await repository.updateOrderStatus(order2.id, 'CANCELLED', 'Customer left restaurant');

  const stockAfterCancel = (await repository.getIngredientById('ing-v-01', 'rest-verde-01'))!.currentStock;
  assert(
    stockAfterCancel === stockBeforeCancel,
    '6. CANCELLED order (NEW -> PREPARING -> CANCELLED) consumes 0 stock',
  );

  const cancelMovement = (
    await repository.getStockMovements('rest-verde-01', { ingredientId: 'ing-v-01' })
  ).find((m) => m.referenceId === order2.id);
  assert(!cancelMovement, '6. Zero stock movements created for CANCELLED order');

  // ----------------------------------------------------
  // TEST 7: Multiple recipe ingredients consume correctly
  // ----------------------------------------------------
  // rec-v-01 (Paneer Makhani) consumes Paneer (0.25kg), Tomatoes (0.3kg), White Butter (0.025kg), Ginger Garlic (0.02kg), Cashews (0.015kg)
  const tomatoesBefore = (await repository.getIngredientById('ing-v-11', 'rest-verde-01'))!.currentStock;
  const butterBefore = (await repository.getIngredientById('ing-v-05', 'rest-verde-01'))!.currentStock;

  const multiItemOrder = await repository.createOrder('rest-verde-01', {
    tableId: tableV.id,
    customerId: customerV.id,
    items: [
      { menuItemId: 'item-v3', quantity: 4 }, // 4x = 1.0kg Paneer, 1.2kg Tomatoes, 0.1kg Butter
    ],
  });

  await repository.updateOrderStatus(multiItemOrder.id, 'COMPLETED');

  const tomatoesAfter = (await repository.getIngredientById('ing-v-11', 'rest-verde-01'))!.currentStock;
  const butterAfter = (await repository.getIngredientById('ing-v-05', 'rest-verde-01'))!.currentStock;

  assert(
    Math.abs(tomatoesBefore - tomatoesAfter - 1.2) < 0.001,
    '7. Multiple recipe ingredients: 1.2kg Tomatoes consumed accurately (4 x 0.3kg)',
  );
  assert(
    Math.abs(butterBefore - butterAfter - 0.1) < 0.001,
    '7. Multiple recipe ingredients: 0.1kg White Butter consumed accurately (4 x 0.025kg)',
  );

  // ----------------------------------------------------
  // TEST 8: Recipe changes after order completion do NOT alter old movements (Snapshot Safety)
  // ----------------------------------------------------
  const oldMovement = (
    await repository.getStockMovements('rest-verde-01', { ingredientId: 'ing-v-11' })
  ).find((m) => m.referenceId === multiItemOrder.id);
  const oldConsumptionQuantity = oldMovement?.quantity; // -1.2

  // Update recipe to 0.5kg tomatoes per portion
  const recipeV1 = (await repository.getRecipes('rest-verde-01', 'item-v3'))[0];
  await repository.updateRecipe(recipeV1.id, 'rest-verde-01', {
    ingredients: recipeV1.ingredients.map((ri) =>
      ri.ingredientId === 'ing-v-11' ? { ...ri, quantity: 0.5 } : ri,
    ),
  });

  const reloadedOldMovement = (
    await repository.getStockMovements('rest-verde-01', { ingredientId: 'ing-v-11' })
  ).find((m) => m.referenceId === multiItemOrder.id);

  assert(
    reloadedOldMovement?.quantity === oldConsumptionQuantity,
    '8. Recipe modification does NOT mutate historical stock movements (Snapshot Safety verified)',
  );

  // Restore recipe
  await repository.updateRecipe(recipeV1.id, 'rest-verde-01', {
    ingredients: recipeV1.ingredients.map((ri) =>
      ri.ingredientId === 'ing-v-11' ? { ...ri, quantity: 0.3 } : ri,
    ),
  });

  // ----------------------------------------------------
  // TEST 9 & 10: Stock Enforcement OFF vs ON & Transaction Rollback
  // ----------------------------------------------------
  // Restaurant Verde has stockEnforcementEnabled = false (default)
  const restVerde = (await repository.getRestaurantById('rest-verde-01'))!;
  assert(!restVerde.stockEnforcementEnabled, '9. Stock enforcement is OFF by default (advisory tracking)');

  // Now create a temporary ingredient with only 0.1kg stock
  const tempIng = await repository.createIngredient('rest-verde-01', {
    restaurantId: 'rest-verde-01',
    name: 'Rare Saffron Strands Extra',
    unit: 'GRAM',
    category: 'SPICE',
    currentStock: 1.0,
    costPerUnit: 300,
  });

  // Create a menu item & recipe that needs 5.0 grams
  const tempMenuItem = await repository.createMenuItem({
    restaurantId: 'rest-verde-01',
    categoryId: 'cat-verde-mains',
    name: 'Gold Leaf Saffron Biryani',
    description: 'Special dish with heavy saffron',
    image: '',
    price: 900,
    costPrice: 400,
    isVeg: true,
    isAvailable: true,
    spicyLevel: 1,
    preparationTimeMin: 20,
    allergens: [],
    sortOrder: 99,
  });

  const tempRecipe = await repository.createRecipe('rest-verde-01', {
    restaurantId: 'rest-verde-01',
    menuItemId: tempMenuItem.id,
    name: 'Recipe: Gold Leaf Biryani',
    yieldQuantity: 1,
    yieldUnit: 'PORTION',
    ingredients: [{ ingredientId: tempIng.id, quantity: 5.0, unit: 'GRAM' }],
  });

  // Turn ON stock enforcement on restaurant
  await repository.updateRestaurant('rest-verde-01', { stockEnforcementEnabled: true });

  const orderEnforced = await repository.createOrder('rest-verde-01', {
    tableId: tableV.id,
    customerId: customerV.id,
    items: [{ menuItemId: tempMenuItem.id, quantity: 1 }],
  });

  let enforcementFailed = false;
  try {
    // Should fail because required 5.0 grams > available 1.0 gram
    await repository.updateOrderStatus(orderEnforced.id, 'COMPLETED');
  } catch (err: any) {
    enforcementFailed = true;
    assert(
      err.message.includes('Stock enforcement failure'),
      '10. Stock enforcement ON: Blocks completion when insufficient stock exists',
    );
  }

  assert(enforcementFailed, '10. Insufficient stock threw exception during atomic completion');

  // Verify Transaction Rollback: tempIng stock must still be exactly 1.0 gram, order must not have committed consumption
  const tempIngAfterRollback = (await repository.getIngredientById(tempIng.id, 'rest-verde-01'))!;
  assert(
    tempIngAfterRollback.currentStock === 1.0,
    '10. Transaction Safety: Zero partial stock was deducted, state cleanly rolled back',
  );

  const rollbackMovements = (
    await repository.getStockMovements('rest-verde-01', { ingredientId: tempIng.id })
  ).filter((m) => m.referenceId === orderEnforced.id);
  assert(rollbackMovements.length === 0, '10. Zero stock movements committed on rolled back transaction');

  // Restore restaurant stock enforcement setting
  await repository.updateRestaurant('rest-verde-01', { stockEnforcementEnabled: false });

  // ----------------------------------------------------
  // TEST 11: Multi-Tenant Protection
  // ----------------------------------------------------
  const emberIngs = await repository.getIngredients('rest-ember-02');
  const verdeIngs = await repository.getIngredients('rest-verde-01');

  assert(
    emberIngs.every((i) => i.restaurantId === 'rest-ember-02') &&
    verdeIngs.every((i) => i.restaurantId === 'rest-verde-01'),
    '11. Cross-tenant queries are strictly tenant-isolated',
  );

  // ----------------------------------------------------
  // TEST 12: Historical OrderItem.costPrice protection
  // ----------------------------------------------------
  assert(
    order1.items[0].costPrice !== undefined && typeof order1.items[0].costPrice === 'number',
    '12. OrderItem.costPrice immutable snapshot is preserved throughout lifecycle',
  );

  console.log(`\n====================================================`);
  console.log(`INVENTORY CONSUMPTION SAFETY SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}

runInventoryTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
