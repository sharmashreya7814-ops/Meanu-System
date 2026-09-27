import { repository } from './server/src/db/repository.js';
import { app } from './server/src/server.js';

async function testDebug() {
  console.log('=== DEBUGGING CUSTOMER ORDER FLOW ===');
  const restaurant = await repository.getRestaurantBySlug('verde-botanica');
  console.log('Restaurant:', restaurant?.id, restaurant?.name);

  const tables = await repository.getTablesByRestaurant(restaurant!.id);
  console.log('Tables for restaurant:', tables.map(t => ({ id: t.id, number: t.tableNumber })));

  const customer = await repository.createOrUpdateCustomer({
    restaurantId: restaurant!.id,
    name: 'Test Customer',
    mobileNumber: '+91 98765 43210',
    tableId: tables[0].id,
  });
  console.log('Customer created:', customer.id);

  const menu = await repository.getMenuItemsByRestaurant(restaurant!.id);
  console.log('Menu items count:', menu.length);

  const order = await repository.createOrder(restaurant!.id, {
    tableId: tables[0].id,
    customerId: customer.id,
    items: [
      { menuItemId: menu[0].id, quantity: 2 },
      { menuItemId: menu[1].id, quantity: 3 },
    ],
  });
  console.log('Order created:', { id: order.id, number: order.orderNumber, status: order.status, total: order.totalAmount, restaurantId: order.restaurantId });

  // Now query orders for restaurant
  const adminOrders = await repository.getOrdersByRestaurant(restaurant!.id);
  console.log('Admin orders count for restaurant:', adminOrders.length);
  console.log('First 3 orders:', adminOrders.slice(0, 3).map(o => ({ id: o.id, number: o.orderNumber, status: o.status, restaurantId: o.restaurantId, items: o.items.length })));
}

testDebug().catch(console.error);
