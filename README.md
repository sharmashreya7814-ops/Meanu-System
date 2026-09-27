# QR-Based Restaurant Food Ordering System

A production-ready, contactless dining and table ordering web platform built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Node.js Express**, **Prisma**, and **PostgreSQL**.

---

## 1. Project Purpose

This application eliminates physical paper menus and ordering queues in restaurants by enabling table-specific QR code scanning. When a diner arrives at a table:
1. They scan the table QR code (`/restaurant/:restaurantSlug/table/:tableId`).
2. The system auto-identifies the restaurant tenant and table number.
3. The customer enters their name and phone number (no friction, no app download, no account password).
4. The customer browses a categorized, animated digital menu with custom restaurant theming.
5. The customer customizes items, adds them to their table cart, and places an order.
6. The backend validates prices from the database (preventing client-side tampering) and dispatches the ticket directly to the Kitchen Display System (KDS).
7. The diner tracks their meal status live from preparation to table delivery.

---

## 2. Architecture & System Separation

The project enforces a clean separation of concerns:

```
├── client/ (src/)
│   ├── components/
│   │   ├── common/       # Resilient UI primitives (Badges, QR Generator, Modals)
│   │   ├── customer/     # Customer mobile-first flow (Welcome, Form, Menu, Cart, Status)
│   │   └── admin/        # Admin & Kitchen operations (Dashboard, KDS, Tables, Menu, Categories)
│   ├── context/          # State management (RestaurantContext, CartContext)
│   ├── pages/            # View routers (CustomerApp, AdminApp, LauncherPage)
│   ├── services/         # Typed REST API service client (api.ts)
│   ├── themes/           # Decoupled Theme System (VEG_THEME, NON_VEG_THEME presets)
│   └── types/            # Shared TypeScript domain definitions
│
├── server/ (server/src/)
│   ├── controllers/      # REST API Controllers (Restaurant, Menu, Order, Admin)
│   ├── db/               # In-Memory & Prisma Repository data layer + Seed Data
│   ├── middleware/       # Input sanitization, validation, and centralized error handling
│   ├── routes/           # Express REST API routes (/api/*)
│   ├── services/         # Order creation & security verification
│   └── types/            # Backend interfaces and DTOs
│
└── prisma/
    └── schema.prisma     # Relational PostgreSQL database schema
```

---

## 3. Technology Stack

- **Frontend**: React 19, Vite 8, TypeScript
- **Styling**: Tailwind CSS v4
- **Motion & Animations**: Motion for React (`motion`)
- **Icons**: Lucide React
- **QR Engine**: `qrcode` vector canvas rendering & print generator
- **Backend API**: Node.js, Express 4, TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM
- **API Protocol**: RESTful JSON API with strict input sanitization

---

## 4. Theme Configuration Engine

The customer-facing application is never locked to a single hardcoded style. It receives theme tokens dynamically:

- **`VEG_THEME` (Verde Botanica)**:
  - Color Palette: Emerald, Sage, Botanical greens with Slate 50 background
  - Typography: Editorial *Fraunces* serif headings + *Plus Jakarta Sans* body
  - Geometry: Clean bordered cards with subtle elevations
  
- **`NON_VEG_THEME` (The Ember & Smokehouse)**:
  - Color Palette: Deep charcoal, obsidian canvas with warm amber and orange accents
  - Typography: Modern *Syne* display headings + *Plus Jakarta Sans* body
  - Geometry: Glassmorphic cards with frosted backdrop filters

---

## 5. Security & Price Integrity

- **Server-Side Price Validation**: The frontend only transmits `{ menuItemId, quantity, specialInstructions }`. The Express backend queries the authoritative database record for current unit price and tax calculation before creating order items.
- **XSS Sanitization**: Customer names, phone numbers, and cooking instructions are scrubbed with `sanitizeInput` middleware.
- **Tenant Isolation**: Orders and tables are scoped to `restaurantId`.

---

## 6. Environment Variables

Define the following in your `.env` file:

```env
# Server Port
PORT=3000

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:password@localhost:5432/restaurant_qr_db?schema=public"

# Runtime Environment
NODE_ENV=development

# Optional Gemini API Key (if extending with smart culinary descriptions)
GEMINI_API_KEY=""
```

---

## 7. How to Run Frontend & Backend

### Prerequisites
- Node.js >= 18
- npm or yarn

### Installation
```bash
# Install all dependencies
npm install
```

### Running Development Server (Unified Dev Mode)
The application includes a Vite Express plugin that mounts all `/api/*` endpoints directly inside the dev process:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Production Server
```bash
# Build the React bundle
npm run build

# Start the Node.js Express server
npm start
```

---

## 8. Database & PostgreSQL Setup with Prisma

### 1. Configure PostgreSQL Connection
Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/restaurant_qr_db?schema=public"
```

### 2. Generate Prisma Client & Run Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to PostgreSQL database
npx prisma db push

# (Optional) Open Prisma Studio visual browser
npx prisma studio
```

---

## 9. API Endpoint Specification

### Public Customer Endpoints:
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/restaurants` | List active restaurants |
| `GET` | `/api/restaurants/:slug` | Get restaurant details & theme configuration |
| `GET` | `/api/restaurants/:slug/tables/:tableId` | Get table & seating info |
| `POST` | `/api/restaurants/:slug/customers/session` | Create or update customer dining session |
| `GET` | `/api/restaurants/:slug/categories` | Get menu categories |
| `GET` | `/api/restaurants/:slug/menu` | Get all food items |
| `POST` | `/api/restaurants/:slug/orders` | Place a new order with verified server prices |
| `GET` | `/api/restaurants/:slug/orders/:orderNumber` | Get order and live fulfillment status |

### Admin & Kitchen Endpoints:
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/overview?restaurantId=...` | Get live operational metrics and revenue |
| `GET` | `/api/admin/orders?restaurantId=...` | List orders for KDS with status filtering |
| `PATCH` | `/api/orders/:orderId/status` | Advance order status (NEW → ACCEPTED → PREPARING → READY → SERVED → COMPLETED) |
| `GET` | `/api/admin/tables?restaurantId=...` | List tables and QR deep-links |
| `POST` | `/api/admin/tables` | Add new table station |
| `POST` | `/api/admin/menu-items` | Create new menu item with costPrice |
| `PATCH` | `/api/admin/menu-items/:id` | Update menu item details or toggle stock |
| `POST` | `/api/admin/categories` | Create new menu category |
| `PATCH` | `/api/admin/theme` | Update restaurant theme preset & custom colors |

---

## 10. Scope & Future Roadmap

### ✅ Current MVP Foundation Scope:
- [x] Multi-tenant restaurant database models
- [x] Table identification via `/restaurant/:slug/table/:tableId`
- [x] Frictionless customer identification (Name + Mobile)
- [x] Decoupled theme system (`VEG_THEME` & `NON_VEG_THEME`)
- [x] Interactive food item details, allergens, notes, and cart drawer
- [x] Server-side price verification on order creation
- [x] Live Order Status Timeline (NEW → ACCEPTED → PREPARING → READY → SERVED)
- [x] Kitchen Order Management Display (KDS)
- [x] Printable Table QR Code flyer generator
- [x] Menu & Category management

### 🚀 Future Planned Modules (Phase 2):
- **Digital Billing**: Split bills, service charges, PDF receipt download
- **Contactless Payments**: Stripe, UPI, Apple Pay, Google Pay integration
- **Profit/Loss Analytics**: Recipe cost vs selling price margin matrix, table turnover velocity
- **Customer CRM**: Dining history, allergy alerts, repeat customer perks
- **Inventory Management**: Automated ingredient stock deduction upon order completion
