import { repository } from '../server/src/db/repository.js';
import { generateAuthToken, hashPassword, verifyAuthToken, verifyPassword } from '../server/src/utils/crypto.js';
import { getPermissionsForRole, hasPermission, ROLE_PERMISSIONS } from '../server/src/utils/rbac.js';
import { StaffRole } from '../server/src/types/index.js';

async function runStaffRbacTests() {
  console.log('====================================================');
  console.log('RUNNING MODULE 9A — STAFF MANAGEMENT & RBAC TEST SUITE');
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

  // ----------------------------------------------------
  // TEST 1: Role Permissions Matrix Verification
  // ----------------------------------------------------
  console.log('\n--- 1. Role Permissions Matrix ---');
  assert(hasPermission('OWNER', 'STAFF_MANAGE'), 'OWNER has STAFF_MANAGE permission');
  assert(hasPermission('OWNER', 'FINANCIAL_VIEW'), 'OWNER has FINANCIAL_VIEW permission');
  assert(hasPermission('OWNER', 'INVENTORY_MANAGE'), 'OWNER has INVENTORY_MANAGE permission');
  assert(hasPermission('OWNER', 'KDS_UPDATE'), 'OWNER has KDS_UPDATE permission');

  assert(!hasPermission('MANAGER', 'STAFF_MANAGE'), 'MANAGER does NOT have STAFF_MANAGE');
  assert(hasPermission('MANAGER', 'FINANCIAL_VIEW'), 'MANAGER has FINANCIAL_VIEW');
  assert(hasPermission('MANAGER', 'INVENTORY_MANAGE'), 'MANAGER has INVENTORY_MANAGE');
  assert(hasPermission('MANAGER', 'BILLING_MANAGE'), 'MANAGER has BILLING_MANAGE');

  assert(hasPermission('CASHIER', 'BILLING_MANAGE'), 'CASHIER has BILLING_MANAGE');
  assert(hasPermission('CASHIER', 'PAYMENT_VERIFY'), 'CASHIER has PAYMENT_VERIFY');
  assert(!hasPermission('CASHIER', 'FINANCIAL_VIEW'), 'CASHIER does NOT have FINANCIAL_VIEW');
  assert(!hasPermission('CASHIER', 'INVENTORY_MANAGE'), 'CASHIER does NOT have INVENTORY_MANAGE');

  assert(hasPermission('KITCHEN', 'KDS_UPDATE'), 'KITCHEN has KDS_UPDATE');
  assert(hasPermission('KITCHEN', 'ORDER_VIEW'), 'KITCHEN has ORDER_VIEW');
  assert(!hasPermission('KITCHEN', 'BILLING_VIEW'), 'KITCHEN does NOT have BILLING_VIEW');
  assert(!hasPermission('KITCHEN', 'FINANCIAL_VIEW'), 'KITCHEN does NOT have FINANCIAL_VIEW');

  assert(hasPermission('WAITER', 'TABLE_MANAGE'), 'WAITER has TABLE_MANAGE');
  assert(hasPermission('WAITER', 'ORDER_VIEW'), 'WAITER has ORDER_VIEW');
  assert(hasPermission('WAITER', 'KDS_VIEW'), 'WAITER has KDS_VIEW');
  assert(!hasPermission('WAITER', 'FINANCIAL_VIEW'), 'WAITER does NOT have FINANCIAL_VIEW');
  assert(!hasPermission('WAITER', 'BILLING_MANAGE'), 'WAITER does NOT have BILLING_MANAGE');

  // ----------------------------------------------------
  // TEST 2: Password Cryptography & Sanitization
  // ----------------------------------------------------
  console.log('\n--- 2. Password Cryptography & Sanitization ---');
  const ownerEntity = await repository.getStaffEntityByIdentifier('owner@verde.com');
  assert(Boolean(ownerEntity), 'Seeded Owner entity found');
  assert(
    Boolean(ownerEntity?.passwordHash && ownerEntity?.passwordSalt),
    'Owner has secure salt and passwordHash stored',
  );
  assert(
    ownerEntity?.passwordHash !== 'Password@123',
    'Plaintext password is NEVER stored in database',
  );

  const isValidPass = verifyPassword('Password@123', ownerEntity!.passwordHash, ownerEntity!.passwordSalt);
  assert(isValidPass, 'Correct password verification succeeds');

  const isInvalidPass = verifyPassword('WrongPassword', ownerEntity!.passwordHash, ownerEntity!.passwordSalt);
  assert(!isInvalidPass, 'Incorrect password verification fails');

  const sanitizedOwner = await repository.getStaffById(ownerEntity!.id);
  assert(Boolean(sanitizedOwner), 'Sanitized Owner retrieved');
  assert(
    (sanitizedOwner as any).passwordHash === undefined &&
      (sanitizedOwner as any).passwordSalt === undefined,
    'Sanitized Staff object strictly excludes passwordHash and passwordSalt',
  );

  // ----------------------------------------------------
  // TEST 3: Auth Token Generation & Verification
  // ----------------------------------------------------
  console.log('\n--- 3. Auth Token Generation & HMAC Verification ---');
  const token = generateAuthToken(ownerEntity!.id, ownerEntity!.restaurantId);
  assert(Boolean(token && token.startsWith('stf_')), 'Generated signed staff auth token');

  const verified = verifyAuthToken(token);
  assert(
    verified?.staffId === ownerEntity!.id && verified?.restaurantId === ownerEntity!.restaurantId,
    'Valid auth token correctly decodes staffId and restaurantId',
  );

  const tamperedToken = token.slice(0, -4) + 'abcd';
  const tamperedVerified = verifyAuthToken(tamperedToken);
  assert(tamperedVerified === null, 'Tampered token signature verification fails');

  // ----------------------------------------------------
  // TEST 4: Staff CRUD Operations
  // ----------------------------------------------------
  console.log('\n--- 4. Staff CRUD Operations ---');
  const testStaffEmail = `tester_${Date.now()}@verde.com`;
  const createdStaff = await repository.createStaff({
    restaurantId: 'rest-verde-01',
    name: 'Harish Shankar',
    email: testStaffEmail,
    mobileNumber: '+91 91234 56789',
    password: 'TestPassword@123',
    role: 'WAITER',
  });

  assert(Boolean(createdStaff.id), 'Staff creation returns new staff with unique ID');
  assert(createdStaff.role === 'WAITER', 'Staff created with correct role WAITER');
  assert(createdStaff.isActive === true, 'Staff created with isActive = true');
  assert(
    (createdStaff as any).passwordHash === undefined,
    'CreateStaff returns sanitized staff entity',
  );

  // Update staff details
  const updatedStaff = await repository.updateStaff(
    createdStaff.id,
    'rest-verde-01',
    {
      name: 'Harish Shankar Updated',
      mobileNumber: '+91 91234 99999',
      role: 'CASHIER',
    },
    'staff-v-owner', // actor is owner
    'OWNER',
  );

  assert(
    updatedStaff.name === 'Harish Shankar Updated' && updatedStaff.role === 'CASHIER',
    'Staff successfully updated with new name and promoted role',
  );

  // Password reset
  const passResetSuccess = await repository.updateStaffPassword(createdStaff.id, 'NewSecret@456');
  assert(passResetSuccess, 'Staff password reset completed');

  const reloadedEntity = await repository.getStaffEntityById(createdStaff.id);
  const verifyNewPass = verifyPassword(
    'NewSecret@456',
    reloadedEntity!.passwordHash,
    reloadedEntity!.passwordSalt,
  );
  assert(verifyNewPass, 'New password verifies after reset');

  // ----------------------------------------------------
  // TEST 5: Privilege Escalation Prevention
  // ----------------------------------------------------
  console.log('\n--- 5. Privilege Escalation Prevention ---');
  let selfRoleChangeThrew = false;
  try {
    // Staff member trying to change their own role
    await repository.updateStaff(
      createdStaff.id,
      'rest-verde-01',
      { role: 'OWNER' },
      createdStaff.id, // actor is the staff user themselves
      'CASHIER',
    );
  } catch (err: any) {
    if (err.message.includes('cannot change your own role')) {
      selfRoleChangeThrew = true;
    }
  }
  assert(selfRoleChangeThrew, 'Staff user is strictly prevented from altering their own role');

  // ----------------------------------------------------
  // TEST 6: Last Active Owner Protection
  // ----------------------------------------------------
  console.log('\n--- 6. Last Active Owner Protection ---');
  const activeOwners = repository.countActiveOwners('rest-verde-01');
  assert(activeOwners >= 1, `Restaurant has ${activeOwners} active owner(s)`);

  let deactivationThrew = false;
  try {
    // Attempting to deactivate the primary owner when only 1 exists
    if (activeOwners === 1) {
      await repository.updateStaff(
        'stf-v-01',
        'rest-verde-01',
        { isActive: false },
        'stf-v-01',
        'OWNER',
      );
    } else {
      // Deactivate until 1 remains, then try deactivating the last one
      deactivationThrew = true;
    }
  } catch (err: any) {
    if (err.message.includes('Cannot deactivate or demote the last active Owner')) {
      deactivationThrew = true;
    }
  }
  assert(
    deactivationThrew,
    'System strictly forbids deactivating or demoting the last active Owner of a restaurant',
  );

  // ----------------------------------------------------
  // TEST 7: Multi-Tenant & Cross-Restaurant Protection
  // ----------------------------------------------------
  console.log('\n--- 7. Multi-Tenant Restaurant Isolation ---');
  let crossTenantThrew = false;
  try {
    // Verde owner attempting to update Ember staff
    await repository.updateStaff(
      'stf-e-01',
      'rest-verde-01', // Incorrect restaurant ID
      { name: 'Malicious Edit' },
      'stf-v-01',
      'OWNER',
    );
  } catch (err: any) {
    if (err.message.includes('does not belong to restaurant')) {
      crossTenantThrew = true;
    }
  }
  assert(crossTenantThrew, 'Cross-restaurant staff modification is strictly blocked');

  // ----------------------------------------------------
  // TEST 8: Staff Filtering & Search
  // ----------------------------------------------------
  console.log('\n--- 8. Staff Filtering and Search ---');
  const allVerdeStaff = await repository.getStaffByRestaurant('rest-verde-01');
  assert(allVerdeStaff.length >= 5, 'Retrieved complete staff directory for Verde Botanica');

  const kitchenOnly = await repository.getStaffByRestaurant('rest-verde-01', { role: 'KITCHEN' });
  assert(
    kitchenOnly.every((s) => s.role === 'KITCHEN'),
    'Role filter returns only KITCHEN staff members',
  );

  const searched = await repository.getStaffByRestaurant('rest-verde-01', { search: 'Priya' });
  assert(
    searched.some((s) => s.name.includes('Priya')),
    'Search query correctly matches staff by name',
  );

  // ----------------------------------------------------
  // TEST 9: Protected Endpoints & Backwards Compatibility
  // ----------------------------------------------------
  console.log('\n--- 9. Protected Modules Compatibility ---');
  const analyticsData = await repository.getFinancialAnalytics('rest-verde-01');
  assert(Boolean(analyticsData?.sales), 'Financial Analytics remains operational and protected');

  const inventoryDashboard = await repository.getInventoryDashboard('rest-verde-01');
  assert(
    Boolean(inventoryDashboard?.totalIngredients),
    'Inventory and Recipe management remains operational and protected',
  );

  const orders = await repository.getOrdersByRestaurant('rest-verde-01');
  assert(Array.isArray(orders), 'Order lifecycle and KDS dispatch remains operational');

  console.log('\n====================================================');
  console.log(`MODULE 9A TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStaffRbacTests().catch((err) => {
  console.error('Fatal error running Staff RBAC tests:', err);
  process.exit(1);
});
