# StoreRate - Store Rating Platform

StoreRate is a full-stack role-based store rating platform built with React, Express.js, and MySQL. Normal users can discover stores and submit or update ratings from 1–5. Store owners can monitor ratings for their stores, while administrators manage users, stores, and platform-wide statistics.

---

## Features

### Authentication & RBAC
- **Single Login System:** All user roles log in through a single entry point at `/login`. The backend checks the user's role and routes them to their corresponding dashboard:
  - System Administrator → `/admin/dashboard`
  - Store Owner → `/owner/dashboard`
  - Normal User → `/user/dashboard`
- **Security:** Passwords hashed with `bcryptjs` (10 salt rounds). Sessions secured via stateless JSON Web Tokens (JWT) with backend Role-Based Access Control (RBAC) middleware.

### Normal User
- **Public Registration (`/register`):** Validates input constraints:
  - Full Name: Minimum 20 characters, maximum 60 characters.
  - Email: Valid standard email format.
  - Password: 8 to 16 characters, including at least 1 uppercase letter and 1 special character.
  - Address: Required, maximum 400 characters.
- **Store Browsing:** View registered stores with their current average rating and total evaluations.
- **Store Rating Flow:**
  - Unrated state for stores the user has not evaluated yet (`You haven't rated this store yet.`, `☆ ☆ ☆ ☆ ☆`, `[ Rate This Store ]`).
  - Submit ratings from 1 to 5 stars.
  - Rated state displaying submitted score (`⭐ ⭐ ⭐ ⭐ ⭐ 5/5`, `[ Edit Rating ]`).
  - Modify rating without duplicates (enforced by `UNIQUE (user_id, store_id)` database constraint).

### Store Owner
- **Provisioned by Administrator:** Store owners cannot register via the public sign-up page; accounts are created by the System Administrator.
- **Store Performance Metrics:** Displays managed store name, address, email, total verified customer evaluations, and computed average rating.
- **Users Who Rated My Store:** Customer rating table displaying the latest submitted ratings (Customer Name, Email Address, Address, Rating, Date Evaluated).
- **Multi-Tenant Store Isolation:** Store owners can only view ratings belonging to their assigned store. Query parameter manipulation is blocked with `403 Forbidden`.

### System Administrator
- **Platform Analytics Dashboard (`/admin/dashboard`):** Database metrics computed via `COUNT(*)`:
  - Total Users
  - Total Stores
  - Total Ratings
- **User Management (`/admin/users`):**
  - Add Normal Users, System Administrators, and provision Store Owners.
  - User Directory with multi-field search: Name, Email, Address, and Role dropdown (`All`, `Normal User`, `Store Owner`, `Admin`).
  - Two-way column sorting: Name ↑↓, Email ↑↓, Address ↑↓, Role ↑↓.
  - User Details modal showing full user info. If the user is a Store Owner, their assigned Store Name and Average Rating are displayed.
- **Store Management (`/admin/stores`):**
  - Add new stores and assign an existing Store Owner.
  - Store Catalog Table containing exactly 4 columns: `Store Name`, `Email`, `Address`, `Rating`.
  - Multi-field search filters: Store Name, Email, Address.
  - Two-way column sorting: Store Name ↑↓, Email ↑↓, Address ↑↓, Rating ↑↓.

### Ratings
- Ratings range strictly from 1 to 5 stars.
- Platform overall ratings are recalculated immediately after users submit or modify their ratings.

### Search, Filtering & Sorting
- Search stores by Name or Address with 6 quick-sort options for Normal Users.
- Multi-field input filters across Name, Email, Address, and Role for Admin and Owner tables.
- Two-way column header sorting across all data grids.

### Password Management
- Password change modal accessible to all roles in the navigation bar.
- Validates current password and enforces new password rules (8–16 characters, uppercase, special character).

---

## Tech Stack
- **Frontend:** React.js (Vite, React Router v7, Lucide Icons, Pure CSS)
- **Backend:** Express.js (Node.js REST API, JWT Authentication, bcryptjs)
- **Database:** MySQL

---

## Project Structure

```text
store-rating-platform/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/         # UI Views & Dashboards
│   │   │   ├── AdminDashboard.jsx   # Admin statistics, user directory, store catalog
│   │   │   ├── AuthView.jsx         # Unified login & registration forms
│   │   │   ├── LandingPage.jsx      # Portal landing view
│   │   │   ├── Navbar.jsx           # Role-aware navigation header
│   │   │   ├── OwnerDashboard.jsx   # Store metrics & customer ratings table
│   │   │   ├── PasswordModal.jsx    # Change password modal with validation
│   │   │   ├── StarRating.jsx       # Interactive & display star rating component
│   │   │   └── UserDashboard.jsx    # User catalog, search, sort, and rating cards
│   │   ├── services/
│   │   │   └── api.js          # Centralized API fetch wrapper with JWT attachment
│   │   ├── utils/
│   │   │   └── validators.js   # Client-side input validation rules
│   │   ├── App.jsx             # Root routing and session state
│   │   └── index.css           # Vanilla CSS design system
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API (Express.js + MySQL)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # Database connection & table initializers
│   │   ├── controllers/        # Business logic (admin, auth, owner, stores)
│   │   ├── middleware/         # Auth verification, RBAC, and input validators
│   │   ├── routes/             # REST API route handlers
│   │   ├── scripts/            # Database seed script and full system audit
│   │   ├── tests/              # 49 automated unit and integration tests
│   │   └── server.js           # Express app bootstrap
│   ├── .env.example            # Environment variables template
│   └── package.json
│
├── screenshots/                # Application screenshots for documentation
├── .gitignore                  # Git ignore rules for node_modules, .env, and local db files
└── README.md
```

---

## Database Design

The relational database enforces data integrity with foreign keys, cascading rules, and unique constraints:

```sql
-- Users table: stores platform accounts for all three roles
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  address VARCHAR(400) NOT NULL,
  role ENUM('ADMIN', 'USER', 'STORE_OWNER') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Stores table: linked to a store owner account
CREATE TABLE stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  address VARCHAR(400) NOT NULL,
  owner_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Ratings table: single ratings source shared by normal users, owners, and admins
CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  store_id INT NOT NULL,
  rating TINYINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_store (user_id, store_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);
```

---

## Assignment Requirements Coverage

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Single login system** | Unified `/login` page with role-based routing to user, owner, or admin dashboards | ✅ |
| **Normal User registration** | `/register` with validation: Name 20–60 chars, Password 8–16 chars (uppercase + special), Address max 400 | ✅ |
| **Store Owner login** | Owner account created by admin, logs in via `/login` and accesses `/owner/dashboard` | ✅ |
| **Administrator management** | Admin dashboard with live DB statistics, user management, and store catalog | ✅ |
| **Store ratings 1–5** | Strict 1 to 5 star rating submission with overall store average recalculation | ✅ |
| **Modify submitted ratings** | Normal users can update their submitted rating without creating duplicate records | ✅ |
| **Store Owner average rating** | Owner dashboard displays computed average rating (`ROUND(AVG(rating), 1)`) and total evaluations | ✅ |
| **Store Owner customer list** | "Users Who Rated My Store" table displaying reviewer names, emails, addresses, ratings, and dates | ✅ |
| **Admin dashboard statistics** | Live counts for Total Users, Total Stores, and Total Ratings queried via SQL `COUNT(*)` | ✅ |
| **User management** | Admin creates Normal Users, Admins, and provisions Store Owners | ✅ |
| **Store management** | Admin adds stores and assigns store owners from a dropdown | ✅ |
| **Search/filtering** | Name and Address search for users; multi-field filtering across Name, Email, Address, and Role for admin | ✅ |
| **Sorting** | 6 sort options for Normal Users; two-way column sorting (A-Z / Z-A) across all data tables | ✅ |
| **Form validation** | Client and server validation enforcing all challenge character limits and password constraints | ✅ |
| **Password change** | In-app modal accessible to all authenticated roles validating current and new password rules | ✅ |
| **Role-based authorization** | Server-side RBAC middleware returning `403 Forbidden` on unauthorized endpoint access | ✅ |

---

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.0 or higher)

---

### Backend Installation
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

### Frontend Installation
1. Navigate to the `client` directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

### MySQL Setup
1. Ensure your local MySQL service (e.g., `MySQL80`) is running.
2. Create your `.env` file from the example template:
   ```bash
   cd ../server
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*
3. Open `server/.env` and update `DB_PASSWORD` with your local MySQL root password:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=store_rating_platform
   ```
4. The application automatically creates the `store_rating_platform` database and all required tables upon starting.

---

### Seed Data
From the `server` directory, run the seed script to populate initial stores, users, and ratings:
```bash
npm run seed
```

---

### How to Run

1. **Start the Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
   *Backend starts on `http://localhost:5000`.*

2. **Start the Frontend Client:**
   ```bash
   cd client
   npm run dev
   ```
   *Frontend starts on `http://localhost:5173`.*

3. Open your browser and visit:
   ```
   http://localhost:5173
   ```

---

## Demo Credentials

> These accounts are created by the seed script for local testing.
> Do not use these credentials in production.

All pre-seeded demo accounts use the password: `Password@123`

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **System Administrator** | System Administrator Account | `admin@storerating.com` | `Password@123` |
| **Store Owner** | Alexander John Henderson | `alexander@hendersonretail.com` | `Password@123` |
| **Store Owner** | Beatrice Eleanor Vance | `beatrice@vanceartisans.com` | `Password@123` |
| **Normal User** | Christopher David Nolan | `christopher@moviefan.com` | `Password@123` |

---

## Testing

The project includes **49 automated unit and integration tests** verifying validation constraints, authentication security, role authorization, user flows, and store owner data isolation:

```bash
cd server
npm test
```

To run the master end-to-end system audit simulating the full lifecycle across all 3 roles:
```bash
node src/scripts/full-audit.js
```

---

## Screenshots

### Normal User Dashboard
![Normal User Dashboard](screenshots/user-dashboard.png)

### Store Owner Dashboard
![Store Owner Dashboard](screenshots/owner-dashboard.png)

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

---

## Development Convenience

For local development environments where MySQL is not yet configured, the backend includes a zero-configuration SQLite fallback (`database.sqlite`) with identical schemas and constraints so developers can test the application immediately without local database dependencies.
