const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Generate clinic and user data
async function generateUserData() {
  // Test password: 123456
  const plainPassword = '123456';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  // Generate UUIDs
  const clinicId = uuidv4();
  const userId = uuidv4();
  
  // Current timestamp
  const now = new Date().toISOString();
  
  // Clinic data
  const clinic = {
    id: clinicId,
    name: 'کلینیک دندانپزشکی کانی',
    address: null,
    phone: null,
    email: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  // User data
  const user = {
    id: userId,
    phone: '+989185335318',
    password: hashedPassword,
    firstName: 'آران',
    lastName: 'عبدی',
    isActive: true,
    clinicId: clinicId,
    role: 'Owner',
    otpCode: null,
    otpExpiresAt: null,
    createdAt: now,
    updatedAt: now,
  };

  // Generate SQL INSERT statements
  console.log('-- Clinic and User Data for Manual Insertion\n');
  console.log('-- Clinic: کلینیک دندانپزشکی کانی');
  console.log('-- User: آران عبدی');
  console.log('-- Phone: +989185335318');
  console.log('-- Password: 123456\n');
  console.log('-- IMPORTANT: Run the clinic INSERT first, then the user INSERT\n\n');
  
  console.log('-- Step 1: Insert Clinic\n');
  console.log(`INSERT INTO clinics (
  "id",
  "name",
  "address",
  "phone",
  "email",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  '${clinic.id}',
  '${clinic.name}',
  ${clinic.address === null ? 'NULL' : `'${clinic.address}'`},
  ${clinic.phone === null ? 'NULL' : `'${clinic.phone}'`},
  ${clinic.email === null ? 'NULL' : `'${clinic.email}'`},
  ${clinic.isActive},
  '${clinic.createdAt}',
  '${clinic.updatedAt}'
);\n`);

  console.log('-- Step 2: Insert User\n');
  console.log(`INSERT INTO users (
  "id",
  "phone",
  "password",
  "firstName",
  "lastName",
  "isActive",
  "clinicId",
  "role",
  "otpCode",
  "otpExpiresAt",
  "createdAt",
  "updatedAt"
) VALUES (
  '${user.id}',
  '${user.phone}',
  '${user.password}',
  '${user.firstName}',
  '${user.lastName}',
  ${user.isActive},
  '${user.clinicId}',
  '${user.role}',
  ${user.otpCode === null ? 'NULL' : `'${user.otpCode}'`},
  ${user.otpExpiresAt === null ? 'NULL' : `'${user.otpExpiresAt}'`},
  '${user.createdAt}',
  '${user.updatedAt}'
);\n`);

  // Also output as JSON for reference
  console.log('\n-- JSON format (for reference):\n');
  console.log('Clinic:');
  console.log(JSON.stringify(clinic, null, 2));
  console.log('\nUser:');
  console.log(JSON.stringify(user, null, 2));
}

generateUserData().catch(console.error);

