# Collective Sheep Buying System - Business Model

## Overview
A sustainable business model where customers collectively purchase shares of a whole sheep. The sheep is only slaughtered when all parts are reserved, minimizing waste and reducing costs for customers.

## Business Models

### 1. Collective Sheep Shares (الذبيحة المشتركة)
Customers reserve specific cuts from a future sheep. When 100% is reserved, the sheep is processed and delivered.

**Key Features:**
- Visual sheep diagram showing available/reserved parts
- Progress bar showing booking percentage (e.g., 73% booked)
- Area-based grouping for efficient delivery
- Price per cut is lower than individual purchases
- Estimated delivery date based on booking speed

**Customer Benefits:**
- 20-30% cheaper than buying individual cuts
- Fresher meat (slaughtered to order)
- Community building with neighbors
- Transparent process

### 2. Monthly Meat Box Subscription (صندوق اللحوم الشهري)
Fixed monthly subscription with curated meat selections.

**Tiers:**
- **Basic Box (2-3kg)**: 800 EGP/month
  - Mixed popular cuts
  - Serves 2-3 people
  
- **Family Box (5-7kg)**: 1,500 EGP/month
  - Variety of cuts including premium
  - Serves 4-6 people
  
- **Premium Box (10kg+)**: 2,500 EGP/month
  - Premium cuts + ground meat
  - Serves 6-8 people

**Features:**
- Surprise selections each month
- Recipe cards included
- Pause/resume anytime
- Member-only prices on additional orders

### 3. Neighborhood Sheep Groups (مجموعات الحي)
WhatsApp/Telegram groups for neighborhoods to coordinate collective purchases.

**Process:**
1. Admin creates area-specific groups
2. When enough interest, admin opens collective order
3. Neighbors select their cuts
4. Group delivery with reduced delivery fee

## Technical Implementation

### Database Schema

#### Collection: collective_sheep
```json
{
  "sheep_id": "unique_id",
  "status": "booking|fully_booked|processing|delivered",
  "total_weight": 35, // kg
  "area_id": "cairo_metro_nasr_city",
  "created_date": "2024-01-15",
  "target_date": "2024-01-25",
  "parts": {
    "shoulder_right": {
      "weight": 5,
      "price_egp": 850,
      "reserved_by": "user_id",
      "reserved_at": "timestamp"
    },
    "shoulder_left": {
      "weight": 5,
      "price_egp": 850,
      "reserved_by": null
    },
    "leg_right": {
      "weight": 4,
      "price_egp": 950,
      "reserved_by": "user_id2"
    },
    // ... all parts
  },
  "booking_percentage": 73,
  "total_reserved_value": 8500,
  "estimated_completion": "2024-01-20"
}
```

#### Collection: subscription_boxes
```json
{
  "user_id": "user_123",
  "plan": "family", // basic|family|premium
  "status": "active|paused|cancelled",
  "next_delivery": "2024-02-01",
  "delivery_day": 1, // day of month
  "payment_method": "vodafone_cash",
  "delivery_address": {},
  "preferences": {
    "no_organs": true,
    "extra_ground": false
  }
}
```

#### Collection: collective_reservations
```json
{
  "user_id": "user_123",
  "sheep_id": "sheep_456",
  "parts": ["shoulder_left", "ribs"],
  "total_price": 1250,
  "status": "pending|confirmed|delivered",
  "payment_status": "pending|paid",
  "delivery_details": {}
}
```

## UI Components

### 1. Interactive Sheep Diagram
- Visual representation of sheep with clickable parts
- Color coding: Available (green), Reserved (gray), Your selection (blue)
- Real-time updates as parts get reserved
- Mobile-responsive SVG

### 2. Progress Indicator
```
[████████░░] 82% Reserved - Only 3 parts left!
Estimated slaughter date: Jan 25, 2024
```

### 3. Area Selector
- Dropdown to filter collective orders by delivery area
- Shows active collective orders in your area
- Option to start new collective order if none available

## Business Benefits

1. **Reduced Waste**: Only slaughter when fully booked
2. **Better Cash Flow**: Customers pay upfront
3. **Community Building**: Creates loyal customer groups
4. **Predictable Demand**: Subscription model provides steady income
5. **Efficient Delivery**: Area-based grouping reduces costs
6. **Higher Margins**: Selling whole sheep vs individual cuts

## Marketing Messages

**Arabic:**
"اشترك مع جيرانك في ذبيحة كاملة ووفر 30%"
"صندوق اللحوم الشهري - جودة مضمونة توصلك لباب البيت"

**English:**
"Share a whole sheep with your neighbors and save 30%"
"Monthly meat box - Premium quality delivered to your door"

## Implementation Priority

1. **Phase 1**: Collective sheep shares for meat cuts
2. **Phase 2**: Monthly subscription boxes  
3. **Phase 3**: Mobile app with push notifications
4. **Phase 4**: AI-powered demand prediction

## Success Metrics

- Average booking completion time
- Customer retention rate
- Average order value increase
- Delivery efficiency improvement
- Customer satisfaction scores