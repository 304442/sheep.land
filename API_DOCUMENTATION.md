# Sheep Land API Documentation

## Base URL
- Development: `http://localhost:8090/api/`
- Production: `https://sheep.land/api/`

## Authentication
Most endpoints require authentication. Use the PocketBase authentication system:

### Login
```
POST /collections/users/auth-with-password
Content-Type: application/json

{
  "identity": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "record": {
    "id": "abc123",
    "email": "user@example.com",
    "is_admin": false
  }
}
```

Use the token in subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Public Endpoints

### Health Check
```
GET /health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "database": "connected",
  "collections": 15,
  "environment": "production"
}
```

### Products

#### List Products
```
GET /collections/products/records
```

Query Parameters:
- `page` (int): Page number (default: 1)
- `perPage` (int): Items per page (default: 30, max: 100)
- `filter` (string): Filter expression
- `sort` (string): Sort field with +/- prefix

Example:
```
GET /collections/products/records?filter=category_pb='udheya'&sort=-price_egp
```

Response:
```json
{
  "page": 1,
  "perPage": 30,
  "totalItems": 13,
  "totalPages": 1,
  "items": [
    {
      "id": "abc123",
      "item_key": "premium_sheep_1",
      "name_en": "Premium Baladi Sheep",
      "name_ar": "خروف بلدي ممتاز",
      "category_pb": "udheya",
      "price_egp": 8500,
      "weight_kg": 45,
      "current_stock_units": 25,
      "active": true
    }
  ]
}
```

### Orders

#### Create Order
```
POST /collections/orders/records
Content-Type: application/json

{
  "customer_name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "phone": "01012345678",
  "delivery_area": "cairo",
  "delivery_address": "123 Tahrir Square, Cairo",
  "payment_method": "cash_on_delivery",
  "line_items": [
    {
      "item_key_pb": "product_id_here",
      "quantity": 1,
      "name_en": "Premium Sheep",
      "name_ar": "خروف ممتاز",
      "price_egp": 8500
    }
  ],
  "notes": "Please call before delivery"
}
```

Response:
```json
{
  "id": "order123",
  "order_number": "ORD-2024-0001",
  "status": "pending",
  "subtotal_egp": 8500,
  "service_fee_egp": 50,
  "delivery_fee_egp": 0,
  "total_amount_egp": 8550,
  "created": "2024-01-01T00:00:00.000Z"
}
```

## Authenticated Endpoints

### User Profile

#### Get Current User
```
GET /collections/users/auth-refresh
Authorization: Bearer {token}
```

#### Update Profile
```
PATCH /collections/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Name",
  "phone": "01098765432"
}
```

### User Orders

#### List My Orders
```
GET /collections/orders/records?filter=user_id='{user_id}'
Authorization: Bearer {token}
```

## Admin Endpoints (Requires is_admin=true)

### Farm Management

#### Farm Analytics Overview
```
GET /farm/analytics/overview
Authorization: Bearer {admin_token}
```

Response:
```json
{
  "overview": {
    "total_sheep": 150,
    "feed_inventory_value": 25000,
    "low_stock_alerts": 3,
    "pending_checkups": 5,
    "monthly_income": 180000,
    "monthly_expenses": 45000,
    "monthly_profit": 135000
  },
  "generated_at": "2024-01-01T00:00:00.000Z"
}
```

#### Breeding Records
```
GET /farm/breeding/records
Authorization: Bearer {admin_token}
```

Response:
```json
{
  "records": [
    {
      "id": "sheep123",
      "tag_number": "SH-2024-001",
      "birth_date": "2023-06-15",
      "mother_tag": "SH-2022-045",
      "father_tag": "SH-2022-012",
      "breed": "Baladi",
      "gender": "male",
      "current_weight": 35
    }
  ],
  "total": 45
}
```

#### Farm Tasks
```
GET /farm/tasks
Authorization: Bearer {admin_token}
```

Response:
```json
{
  "tasks": [
    {
      "id": "health_abc123",
      "type": "health_checkup",
      "title": "Health checkup for sheep SH-2024-001",
      "due_date": "2024-01-05T00:00:00.000Z",
      "priority": "high",
      "status": "pending"
    }
  ],
  "total": 8
}
```

#### Export Reports
```
POST /farm/reports/export
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "type": "inventory", // or "financial"
  "format": "json" // or "csv"
}
```

### Collections Management

#### Farm Sheep
```
GET /collections/farm_sheep/records
POST /collections/farm_sheep/records
PATCH /collections/farm_sheep/records/{id}
DELETE /collections/farm_sheep/records/{id}
```

Fields:
- `tag_number` (string, required): Unique identifier
- `breed` (string): Sheep breed
- `gender` (string): male/female
- `birth_date` (date): Birth date
- `current_weight` (number): Weight in kg
- `health_status` (string): healthy/sick/quarantine
- `purchase_price` (number): Purchase price in EGP
- `purchase_date` (date): When acquired
- `status` (string): active/sold/deceased

#### Feed Inventory
```
GET /collections/feed_inventory/records
POST /collections/feed_inventory/records
PATCH /collections/feed_inventory/records/{id}
```

Fields:
- `feed_type` (string): Type of feed
- `quantity_kg` (number): Current quantity
- `price_per_kg` (number): Cost per kg
- `reorder_level` (number): When to reorder
- `supplier` (string): Supplier name
- `last_purchase_date` (date): Last purchase

#### Health Records
```
GET /collections/health_records/records
POST /collections/health_records/records
```

Fields:
- `sheep_id` (relation): Link to farm_sheep
- `checkup_date` (date): Date of checkup
- `veterinarian` (string): Vet name
- `diagnosis` (string): Health findings
- `treatment` (string): Treatment given
- `cost` (number): Treatment cost
- `next_checkup_date` (date): Follow-up date

#### Financial Transactions
```
GET /collections/financial_transactions/records
POST /collections/financial_transactions/records
```

Fields:
- `transaction_type` (string): income/expense
- `category` (string): Transaction category
- `amount` (number): Amount in EGP
- `description` (string): Details
- `transaction_date` (date): When occurred
- `payment_method` (string): How paid

### Settings & Configuration

#### Get Settings
```
GET /collections/settings/records
Authorization: Bearer {admin_token}
```

#### Update Settings
```
PATCH /collections/settings/records/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "default_service_fee": 75,
  "international_shipping_fee": 600,
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587
}
```

## Error Responses

All errors follow this format:
```json
{
  "code": 400,
  "message": "Validation error",
  "data": {
    "phone": {
      "code": "validation_invalid_format",
      "message": "Invalid Egyptian phone number format"
    }
  }
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

Default limits:
- Orders: 5 per minute
- Authentication: 10 per minute
- General API: 100 per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

Currently not implemented. Future support planned for:
- Order status changes
- Payment confirmations
- Low stock alerts

## SDKs

Official PocketBase JavaScript SDK:
```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://sheep.land');

// Authenticate
const authData = await pb.collection('users').authWithPassword(
  'user@example.com',
  'password123'
);

// Fetch products
const products = await pb.collection('products').getList();

// Create order
const order = await pb.collection('orders').create({
  customer_name: 'Ahmed Hassan',
  // ... other fields
});
```

## Testing

Use these test credentials:
- **Regular User**: test@sheep.land / test123
- **Admin User**: admin@sheep.land / admin@sheep2024

Test in development mode first:
```bash
curl http://localhost:8090/api/health
```

---

*Last updated: December 2024*
*API Version: 1.0.0*