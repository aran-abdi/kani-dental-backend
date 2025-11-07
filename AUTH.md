# Authentication System

## Overview

The authentication system implements login and password reset functionality with OTP (One-Time Password) verification. User registration is not included as users will be registered by admins later.

## Features

- ✅ **Login** - Email and password authentication with JWT tokens
- ✅ **Password Reset with OTP** - Request OTP and reset password
- ✅ **Mock OTP Provider** - OTP is logged and returned in response (for development)
- ✅ **JWT Authentication** - Bearer token-based authentication
- ✅ **Password Hashing** - Using bcrypt for secure password storage

## API Endpoints

### 1. Login
**POST** `/auth/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2. Request OTP for Password Reset
**POST** `/auth/request-otp`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response (Mock mode - OTP returned in response):
```json
{
  "otpCode": "123456",
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

**Note:** In development/mock mode, the OTP is logged to the console and returned in the response. Check the server logs for the OTP code.

### 3. Reset Password
**POST** `/auth/reset-password`

Request body:
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "newPassword123"
}
```

Response:
```json
{
  "message": "Password reset successfully"
}
```

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

## Database Schema

### User Entity

```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (hashed)
  firstName: string (nullable)
  lastName: string (nullable)
  isActive: boolean (default: true)
  otpCode: string | null
  otpExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds of 10
2. **JWT Tokens**: Secure token-based authentication
3. **OTP Expiration**: OTP codes expire after 5 minutes
4. **Account Status**: Inactive users cannot login

## Usage Example

### 1. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Request OTP
```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### 3. Reset Password
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otpCode": "123456",
    "newPassword": "newPassword123"
  }'
```

### 4. Using JWT Token
```bash
curl -X GET http://localhost:3000/protected-route \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Mock OTP Provider

The OTP service currently mocks the OTP provider. When an OTP is requested:

1. A 6-digit OTP code is generated
2. The OTP is logged to the console with the format:
   ```
   [MOCK OTP] Sending OTP to user@example.com
   [MOCK OTP] OTP Code: 123456
   [MOCK OTP] This OTP will expire in 5 minutes
   ```
3. The OTP is returned in the API response (for development convenience)
4. The OTP is stored in the database with expiration time

**To integrate a real OTP provider:**
1. Update `src/auth/services/otp.service.ts`
2. Replace the `sendOtp` method with your SMS/Email provider
3. Remove OTP from the response (security best practice)

## Creating Test Users

Since user registration is not implemented, you'll need to create users manually in the database. Here's a SQL example:

```sql
-- Hash password: "password123" using bcrypt
-- You can use an online bcrypt generator or Node.js
INSERT INTO users (id, email, password, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'user@example.com',
  '$2b$10$YourHashedPasswordHere',
  'John',
  'Doe',
  true,
  NOW(),
  NOW()
);
```

Or use a migration/seeder script to create test users.

## Next Steps

1. **Integrate Real OTP Provider**: Replace mock OTP with SMS/Email service
2. **Add User Registration**: Admin endpoint to create users
3. **Add Refresh Tokens**: Implement token refresh mechanism
4. **Add Rate Limiting**: Prevent brute force attacks
5. **Add Email Verification**: Verify email addresses
6. **Add Password Strength Validation**: Enforce strong passwords

