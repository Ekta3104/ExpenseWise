# ExpenseWise – Personal Expense & Budget Tracker

A full-stack production-quality MERN application (MongoDB, Express.js, React.js, Node.js) built to help individuals monitor income, track day-to-day expenses across categories, set monthly spending limits with smart alerts, and gain clear visual insights through charts and analytics.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture & Folder Structure](#system-architecture--folder-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Database Models & Schemas](#database-models--schemas)
- [REST API Documentation](#rest-api-documentation)
- [Authentication & Security Flow](#authentication--security-flow)
- [Important Design Decisions](#important-design-decisions)
- [Automated Testing](#automated-testing)
- [Sample Demo Credentials](#sample-demo-credentials)
- [Known Limitations & Future Scope](#known-limitations--future-scope)

---

## Overview

ExpenseWise is engineered for reliability, security, and developer clarity. It follows standard RESTful practices, enforces strict server-side user ownership isolation, computes real-time analytics using MongoDB aggregation pipelines, and delivers a sleek, responsive React frontend.

---

## Key Features

### 1. Authentication & Security
- **JWT-Based Authentication**: Secure stateless authentication using JSON Web Tokens.
- **Bcrypt Password Hashing**: Passwords salted and hashed with 10 rounds prior to database persistence.
- **Strict Data Isolation**: Server-side ownership validation (`userId` matching) prevents any user from viewing, modifying, or deleting another user's records by tampering with URL parameters.
- **Password Masking**: Passwords are systematically excluded from queries and responses (`select: false` and `toJSON` transforms).

### 2. Transaction Management
- Record **Income** and **Expense** transactions.
- Fields: `type`, `amount`, `category`, `date`, `description`/`note`, and `paymentMethod`.
- Positive amount validation (zero and negative values rejected at both frontend and API layers).
- Sorting by date in descending order by default.
- Multi-field filtering:
  - By Transaction Type (`income`, `expense`, or all)
  - By Category
  - By Payment Method (`Cash`, `UPI`, `Credit Card`, `Debit Card`, `Net Banking`, `Other`)
  - By Date Range (`startDate` to `endDate`)
  - Real-time text search across descriptions and category names.
- Pagination controls with total count and page indicators.

### 3. Categories Management
- Preloaded standard categories: `Salary`, `Freelance`, `Investments`, `Food`, `Travel`, `Shopping`, `Bills`, `Entertainment`, `Health`, and `Other`.
- Ability for users to dynamically create custom categories inline or on-demand.

### 4. Monthly Budgeting & Alert Engine
- Set and update monthly budgets per month/year.
- Calculates:
  - Monthly Income
  - Monthly Expenses
  - Net Balance
  - Remaining Budget
  - Budget Used Percentage (`(Expenses / Budget) * 100`)
- **Smart Warnings**:
  - Caution Banner when spending reaches **$\ge 80\%$** of the budget.
  - Critical Alert Banner when spending reaches or exceeds **$100\%$** (displays exact overrun amount).
  - Graceful edge-case handling for months with no transactions ($0\%$ used, no `NaN`) and months without a configured budget.

### 5. Dashboard & Analytics
- 4 Key Metric Cards: Total Income, Total Expenses, Net Balance, Budget Usage.
- **Category-wise Expense Breakdown**: Interactive Doughnut chart (Chart.js) with custom breakdown legend.
- **Income vs Expense Trend**: Grouped 6-month historical bar chart.
- **Month & Year Selector**: Easily cycle through or select any month/year to view historical analytics in real time.
- Recent 5 transactions quick list.

### 6. Bonus Features Implemented
- **CSV Data Export**: One-click download of all transaction history in `.csv` format.
- **CSV Data Import**: Bulk import transactions from CSV files with automatic validation.
- **Previous-Month Comparison**: Calculates month-over-month percentage changes in income and expenses.
- **Dark Mode / Light Mode**: Seamless theme toggle persisted in `localStorage`.
- **Automated Test Suite**: 18 automated tests in Jest + Supertest covering Auth, Transactions, Cross-User Isolation, Budget Math, and MongoDB Aggregations.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Chart.js, React ChartJS 2, React Hot Toast, React Router DOM v6, Axios.
- **Backend**: Node.js, Express.js, Mongoose, JSON Web Token (`jsonwebtoken`), `bcryptjs`, `express-validator`, `multer`, `csv-parser`, `cors`, `dotenv`.
- **Database**: MongoDB (Local Community Server or MongoDB Atlas).
- **Testing**: Jest, Supertest.

---

## System Architecture & Folder Structure

```
ExpenseWise/
├── backend/
│   ├── config/
│   │   └── db.js                 # Mongoose database connection
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── transactionController.js # CRUD, filter, search, pagination, CSV
│   │   ├── budgetController.js   # Budget setup, calculations, warnings
│   │   ├── dashboardController.js# MongoDB Aggregation pipelines
│   │   └── categoryController.js # Default & custom categories
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & req.user binding
│   │   ├── errorMiddleware.js    # 404 & Centralized error handler
│   │   └── validateMiddleware.js # Express-validator format handler
│   ├── models/
│   │   ├── User.js               # User model with bcrypt pre-save hook
│   │   ├── Transaction.js        # Transaction model with compound indexes
│   │   ├── Budget.js             # Budget model with unique compound index
│   │   └── Category.js           # Category model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── categoryRoutes.js
│   ├── tests/
│   │   ├── setup.js              # Test database connector and teardown
│   │   ├── auth.test.js          # Authentication test suite
│   │   ├── transaction.test.js   # CRUD & security isolation tests
│   │   ├── budget.test.js        # Budget formulas & threshold tests
│   │   └── dashboard.test.js     # Aggregation pipeline tests
│   ├── utils/
│   │   └── seed.js               # Database seeding script
│   ├── server.js                 # Express server configuration
│   ├── package.json
│   ├── .env                      # Local env (ignored in git)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Navbar, Modal, StatCard, LoadingSpinner, EmptyState
│   │   │   ├── dashboard/        # SummaryCards, BudgetAlertBanner, MonthSelector, Charts
│   │   │   ├── transactions/     # TransactionModal, TransactionFilters, CsvModal
│   │   │   └── budget/           # BudgetModal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Global session state
│   │   │   └── ThemeContext.jsx  # Dark/Light theme state
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TransactionsPage.jsx
│   │   │   └── BudgetPage.jsx
│   │   ├── services/             # Axios API service modules
│   │   ├── utils/
│   │   │   └── formatters.js     # Currency & date formatters
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env                      # Local env (ignored in git)
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v24.x recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB Server running on port 27017 or a MongoDB Atlas connection URI.

---

## Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expensewise
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

*(Refer to `.env.example` in both folders for templates. Never commit `.env` files).*

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ExpenseWise
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Seed Demo Data** *(Optional but recommended)*:
   ```bash
   cd ../backend
   npm run seed
   ```

---

## Running the Application

### Option A: Run Backend & Frontend Separately

**Terminal 1 (Backend)**:
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
# Frontend will start on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## Database Models & Schemas

### 1. User Model (`models/User.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` | String | Required, Trim | User's full name |
| `email` | String | Required, Unique, Lowercase, Indexed | User's login email |
| `password` | String | Required, Min 6, `select: false` | Hashed with bcrypt |
| `timestamps` | Date | Automatic | `createdAt`, `updatedAt` |

### 2. Transaction Model (`models/Transaction.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `userId` | ObjectId | Ref User, Required, Indexed | Data ownership link |
| `type` | String | Enum (`['income', 'expense']`), Required | Transaction type |
| `amount` | Number | Required, Min: 0.01 | Positive transaction value |
| `category` | String | Required, Trim | Category tag |
| `date` | Date | Required, Default: Date.now | Transaction occurrence date |
| `description` | String | Trim, Optional | Note / details |
| `paymentMethod` | String | Enum (`['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other']`) | Payment medium |

*Compound Indexes*: `{ userId: 1, date: -1 }`, `{ userId: 1, category: 1 }`.

### 3. Budget Model (`models/Budget.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `userId` | ObjectId | Ref User, Required, Indexed | Data ownership link |
| `month` | Number | Required, Range 1 - 12 | Target month |
| `year` | Number | Required, Min 2000 | Target year |
| `amount` | Number | Required, Min: 0 | Spending cap |

*Unique Compound Index*: `{ userId: 1, month: 1, year: 1 }` guarantees one budget per user per month.

---

## REST API Documentation

### Authentication Endpoints
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`). Returns token + user info (HTTP 201).
- `POST /api/auth/login` — Login with credentials (`email`, `password`). Returns token + user info (HTTP 200).
- `GET /api/auth/me` — *(Protected)* Fetch currently logged-in user profile (HTTP 200).

### Transaction Endpoints
- `GET /api/transactions` — *(Protected)* List transactions with query parameters: `type`, `category`, `paymentMethod`, `search`, `startDate`, `endDate`, `month`, `year`, `page`, `limit`, `sortBy`, `order`.
- `GET /api/transactions/:id` — *(Protected)* Retrieve specific transaction (Strict user ownership check).
- `POST /api/transactions` — *(Protected)* Create transaction (`type`, `amount`, `category`, `date`, `paymentMethod`, `description`).
- `PUT /api/transactions/:id` — *(Protected)* Update existing transaction (Strict user ownership check).
- `DELETE /api/transactions/:id` — *(Protected)* Delete transaction (Strict user ownership check).
- `GET /api/transactions/export/csv` — *(Protected)* Download transaction history as CSV.
- `POST /api/transactions/import/csv` — *(Protected)* Upload and bulk ingest transactions from CSV.

### Budget Endpoints
- `GET /api/budget?month=X&year=Y` — *(Protected)* Retrieve budget, current spending, percentage used, remaining balance, and alert status.
- `POST /api/budget` — *(Protected)* Set or update monthly budget for specified month and year.
- `PUT /api/budget/:id` — *(Protected)* Update budget amount by ID.
- `GET /api/budget/history` — *(Protected)* Retrieve historical budget records.

### Dashboard Endpoints
- `GET /api/dashboard?month=X&year=Y` — *(Protected)* Single aggregation endpoint computing summary cards, category-wise breakdowns, 6-month trend, and previous-month comparisons.

### Category Endpoints
- `GET /api/categories` — *(Protected)* List default system categories merged with user-defined custom categories.
- `POST /api/categories` — *(Protected)* Create custom category.
- `DELETE /api/categories/:id` — *(Protected)* Remove custom category.

---

## Authentication & Security Flow

```
Client (React)                  Server (Express)                 Database (MongoDB)
      │                                │                                │
      ├── POST /api/auth/login ───────>│                                │
      │   { email, password }          ├── Find User by email ─────────>│
      │                                │<── Returns user + hash ────────┤
      │                                ├── bcrypt.compare()             │
      │                                ├── Sign JWT(userId)             │
      │<── { token, user } ────────────┤                                │
      │                                │                                │
      ├── GET /api/transactions ──────>│                                │
      │   Header: Bearer <token>       ├── authMiddleware: verify JWT   │
      │                                ├── req.user = decodedUser       │
      │                                ├── Query: { userId: req.user } ─>│
      │                                │<── Returns owned data only ────┤
      │<── User's isolated data ───────┤                                │
```

### Strict Authorization Rule
When performing any read, update, or delete on an entity:
```javascript
// Example: Strict user isolation in transactionController.js
const transaction = await Transaction.findOne({
  _id: req.params.id,
  userId: req.user._id // Mandatory filter
});

if (!transaction) {
  return res.status(404).json({
    success: false,
    message: 'Transaction not found or unauthorized'
  });
}
```
Even if User B learns or guesses transaction ID `123` belonging to User A, User B's request will return `404 Not Found or unauthorized`, preventing IDOR (Insecure Direct Object Reference) vulnerabilities.

---

## Important Design Decisions

1. **MongoDB Aggregation Pipelines for Analytics**: Rather than fetching thousands of raw records into the frontend and computing totals in JavaScript, calculations use `$match`, `$group`, and `$facet` aggregations directly on the database engine.
2. **Server-Side Validation with Express-Validator**: While the React UI performs real-time client validation, backend validation is enforced to guarantee that direct API requests cannot bypass constraints.
3. **Compound Indexes**: Added indexes on `{ userId: 1, date: -1 }` and `{ userId: 1, month: 1, year: 1 }` to maintain $O(\log n)$ performance even with high transaction volumes.
4. **Vite Proxy & CORS Configuration**: In development, Vite proxies `/api` calls directly to `http://localhost:5000` avoiding CORS friction while Express retains strict CORS origin whitelisting for production.
5. **Safe Seed Database Utility**: Provides a ready-to-run mock dataset enabling immediate manual testing and seamless interview demonstration.

---

## Automated Testing

The backend includes a comprehensive Jest and Supertest automated test suite.

Run tests:
```bash
cd backend
npm test
```

### Test Coverage Highlights:
- `tests/auth.test.js`: Registration, password hashing, duplicate email detection, valid/invalid login, token verification.
- `tests/transaction.test.js`: Positive amount validation, filtering, searching, and cross-user data isolation (User B unable to read, edit, or delete User A's data).
- `tests/budget.test.js`: Budget calculation formulas, $\ge 80\%$ warning threshold, $\ge 100\%$ budget exceeded threshold, empty month edge cases.
- `tests/dashboard.test.js`: MongoDB aggregation facets, category breakdown, 6-month trends.

---

## Sample Demo Credentials

For quick evaluation during technical review:

| Account | Email | Password | Role |
|---|---|---|---|
| **Primary Demo** | `alex@example.com` | `password123` | Has pre-seeded budget, transactions & analytics |
| **Secondary User** | `sarah@example.com` | `password123` | Used to verify cross-user isolation |

*(You can also register any new account on the Register page).*

---

## Known Limitations & Future Scope

1. **Multi-Currency Support**: Currently defaults to INR (₹). A future release could add real-time currency conversion via foreign exchange APIs.
2. **Split Transactions**: A single transaction currently maps to a single category. Future versions could support itemized category splitting.
3. **Receipt Image Attachments**: Could integrate AWS S3 or Cloudinary for uploading and scanning receipt images with OCR.
