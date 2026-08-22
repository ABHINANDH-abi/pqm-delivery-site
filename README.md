# Restaurant Delivery Platform

A production-grade, single-restaurant food delivery platform built with a modern TypeScript-first stack.

## Applications

| App | Technology | Port / Notes |
|-----|-----------|------|
| `customer-app` | React Native + Expo + TypeScript | Expo Go / simulator |
| `delivery-app` | React Native + Expo + TypeScript | Expo Go / simulator |
| `admin-dashboard` | React + Vite + TypeScript + Tailwind CSS | http://localhost:5173 |
| `backend` | Node.js + Express + TypeScript + Prisma | http://localhost:4000 |

## Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14 (running locally or via Docker)
- Expo Go app on your phone (for mobile development)

## Project Structure

```
restaurant-delivery/
├── customer-app/        # Customer mobile app (React Native + Expo)
├── delivery-app/        # Delivery partner mobile app (React Native + Expo)
├── admin-dashboard/     # Admin web dashboard (React + Vite + Tailwind)
├── backend/             # REST API server (Express + Prisma + PostgreSQL)
├── shared/              # Shared TypeScript types and constants
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone and install dependencies

```bash
# Install shared package
cd shared && npm install && cd ..

# Install backend
cd backend && npm install && cd ..

# Install admin dashboard
cd admin-dashboard && npm install && cd ..

# Install customer app
cd customer-app && npm install && cd ..

# Install delivery app
cd delivery-app && npm install && cd ..
```

### 2. Configure environment variables

Each application has a `.env.example` file. Copy it to `.env` and fill in the values.

```bash
cp backend/.env.example backend/.env
cp admin-dashboard/.env.example admin-dashboard/.env
cp customer-app/.env.example customer-app/.env
cp delivery-app/.env.example delivery-app/.env
```

### 3. Set up the database

Make sure PostgreSQL is running. Update `DATABASE_URL` in `backend/.env`, then run:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run each application

**Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:4000
# Health check: GET http://localhost:4000/health
```

**Admin Dashboard:**
```bash
cd admin-dashboard
npm run dev
# Runs on http://localhost:5173
```

**Customer App:**
```bash
cd customer-app
npx expo start
# Scan QR code with Expo Go app
```

**Delivery App:**
```bash
cd delivery-app
npx expo start
# Scan QR code with Expo Go app
```

## User Roles

| Role | Access |
|------|--------|
| `CUSTOMER` | Browse menu, manage cart, place orders, track delivery |
| `ADMIN` | Manage menu, view/manage orders, manage delivery partners |
| `DELIVERY_PARTNER` | View assigned orders, update delivery status |

## Order Lifecycle

```
PLACED → ACCEPTED → PREPARING → READY → ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
                                      ↘ CANCELLED / REJECTED
```

## API Base URL

- Development: `http://localhost:4000/api/v1`
- Health check: `GET http://localhost:4000/health`

## Environment Variables

See `.env.example` in each application directory for required variables.

**Never commit `.env` files. They are listed in `.gitignore`.**

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT + bcryptjs
- **Validation**: Zod
- **Security**: Helmet, CORS, express-rate-limit

### Customer App / Delivery App
- **Framework**: React Native + Expo SDK 51
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State**: Zustand
- **HTTP**: Axios
- **Secure Storage**: expo-secure-store

### Admin Dashboard
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: Zustand
- **HTTP**: Axios

## Services to Integrate (Future Stages)

- **Cloudinary** — food/restaurant image storage
- **Razorpay** — online payments
- **Firebase Cloud Messaging** — push notifications
- **Google Maps** — delivery navigation and tracking

## Development Stages

- **Stage 1** ✅ — Project structure, scaffolding, database schema, environment setup
- **Stage 2** — Authentication (register, login, JWT, role-based middleware)
- **Stage 3** — Product & Category APIs + Admin dashboard menu management
- **Stage 4** — Customer app home, browsing, cart, checkout flow
- **Stage 5** — Order management and lifecycle API
- **Stage 6** — Delivery partner app + order tracking
- **Stage 7** — Payments (Razorpay integration)
- **Stage 8** — Push notifications (FCM)
- **Stage 9** — Maps integration, production hardening, deployment
