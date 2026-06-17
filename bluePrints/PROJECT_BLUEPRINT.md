# NAPP Project Blueprint

## Project Overview
**NAPP** is a Next.js 16 full-stack application with role-based authentication and multi-tenant dashboard system. It uses PostgreSQL (via Prisma), Supabase for auth/DB, TypeScript, React 19, and Tailwind CSS for styling.

---

## 📁 Directory Structure & Purpose

### **Root Configuration Files**
```
package.json              → Project dependencies (Next.js 16, React 19, Prisma, TypeScript, Tailwind)
tsconfig.json            → TypeScript compiler configuration (ES2017 target, strict mode enabled)
next.config.ts           → Next.js configuration (currently empty/minimal)
postcss.config.mjs       → PostCSS configuration for Tailwind CSS
eslint.config.mjs        → ESLint rules for code linting
prisma.config.ts         → Prisma CLI configuration
.env                     → Environment variables (DATABASE_URL for Prisma Postgres)
.env.local               → Local environment overrides (dev-only)
.gitignore               → Git ignore rules
next-env.d.ts            → Next.js TypeScript type definitions
```

---

### **📱 `/app` - Next.js App Router (Main Application)**

#### Structure:
```
app/
├── layout.tsx            → Root layout wrapper (applies to all pages)
├── page.tsx              → Home page (default: Next.js starter template)
├── favicon.ico           → Browser tab icon
├── styles/
│   └── globals.css       → Global Tailwind & CSS styles
├── login/
│   └── page.tsx          → Login/authentication page
├── dashboard/            → Role-based dashboards
│   ├── admin/page.tsx    → Admin dashboard
│   ├── student/page.tsx  → Student dashboard
│   ├── worker/page.tsx   → Worker dashboard
│   ├── donor/page.tsx    → Donor dashboard
│   ├── investor/page.tsx → Investor dashboard
│   └── operator/page.tsx → Operator dashboard
├── api/
│   └── admin/
│       └── stats/
│           └── route.ts  → API endpoint for admin stats (GET/POST handler)
```

**Purpose**: Server-rendered pages using Next.js App Router. Each dashboard is a separate page accessible by role. API routes handle backend logic.

---

### **🧩 `/components` - Reusable React Components**

```
components/
├── AuthForm.tsx         → Login/signup form component (handles auth input)
├── Navbar.tsx           → Navigation bar (displayed on all pages)
├── Footer.tsx           → Footer component
├── RoleGate.tsx         → Authorization wrapper (shows content only if user has role)
```

**Purpose**: Shared, reusable React components used across multiple pages.

---

### **📦 `/context` - React Context (Global State)**

```
context/
└── AuthContext.tsx      → Global authentication state
                         → Manages: logged-in user, roles, permissions
                         → Shared across app via Context Provider
```

**Purpose**: Centralized state management for authentication without prop drilling.

---

### **🛠️ `/lib` - Utility Functions & Services**

```
lib/
├── supabaseClient.ts    → Supabase client initialization
                         → Handles: authentication, database queries via Supabase JS SDK
├── prisma.ts           → Prisma client singleton
                         → Handles: database queries (direct PostgreSQL access)
├── authHelpers.ts      → Authentication utility functions
                         → Handles: token validation, session checks, login/logout logic
├── aiClient.ts         → AI service client (likely for external AI API)
                         → Handles: API calls to AI service
```

**Purpose**: Business logic, API clients, and utility functions (DRY principle).

---

### **🗄️ `/prisma` - Database Schema & Migrations**

```
prisma/
└── schema.prisma       → Database schema definition
                         → Defines models: User, Profile, Role, Permission, RolePermission
                         → Configured for PostgreSQL (Supabase)
```

**Models**:
- **User**: id, email (unique)
- **Profile**: id, fullName, role, userId (1:1 with User)
- **Role**: id, name (unique), description, associated permissions
- **Permission**: id, action (unique), description
- **RolePermission**: Junction table (role ↔ permission relationship)

**Purpose**: Defines the database schema and enables type-safe queries via Prisma Client.

---

### **📚 `/supabase` - Supabase Configuration**

```
supabase/
├── config.toml         → Supabase local configuration
├── .branches/          → Branch management for Supabase
├── snippets/           → Saved SQL queries (development/testing)
└── .temp/              → Temporary files
```

**Purpose**: Configuration for Supabase (auth + database backend).

---

### **🎨 `/public` - Static Assets**

```
public/
├── next.svg            → Next.js logo
├── vercel.svg          → Vercel logo
├── globe.svg           → Globe icon
├── window.svg          → Window icon
└── file.svg            → File icon
```

**Purpose**: Static files served directly (images, icons, etc.).

---

### **📄 Documentation Files**

```
README.md               → Project overview & setup instructions
AGENTS.md              → Configuration for AI agents (if using GitHub Copilot)
CLAUDE.md              → AI-specific instructions (minimal)
```

---

### **🔒 Ignored Directories**

```
.next/                 → Next.js build output (auto-generated)
node_modules/          → Installed npm dependencies (auto-generated)
.git/                  → Git repository metadata
```

---

## 🏗️ Application Architecture

### **Technology Stack**
- **Frontend**: React 19, Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 7.8.0
- **Authentication**: Supabase Auth
- **Language**: TypeScript 5
- **Linting**: ESLint 9

### **Data Flow**
1. User logs in via `AuthForm` → **AuthContext** stores user/role
2. `RoleGate` checks permissions and renders role-specific content
3. API routes query database via **Prisma** (PostgreSQL/Supabase)
4. Dashboard pages render role-specific data

### **Role-Based Access Control (RBAC)**
- Roles: Admin, Student, Worker, Donor, Investor, Operator
- Each role has associated Permissions
- Database tables: Role, Permission, RolePermission, Profile

---

## ⚠️ Known Issues / Missing Setup

**Prisma Schema Issue** (Line 14-17):
- Duplicate `datasource db` declarations
- Only one should be defined; remove line 14-16

**TODO Items**:
- [ ] Fix duplicate datasource in `prisma/schema.prisma`
- [ ] Implement API endpoints (currently only admin/stats stub)
- [ ] Build out dashboard page logic (pages exist but likely not fully functional)
- [ ] Set up Supabase migrations
- [ ] Test role-based access control flow
- [ ] Configure environment variables for production
- [ ] Implement error boundaries and error handling
- [ ] Add loading states and proper error UI

---

## 🚀 Setup & Development Commands

```bash
npm run dev     # Start development server (http://localhost:3000)
npm run build   # Build for production
npm start       # Run production server
npm run lint    # Run ESLint
```

---

## 📋 File Dependencies

```
page.tsx (home)
  ↓
layout.tsx (root layout)
  ↓
Navbar.tsx, Footer.tsx, AuthContext (global state)
  ↓
login/page.tsx → AuthForm → authHelpers.ts → supabaseClient.ts
  ↓
dashboard/* → RoleGate → AuthContext
  ↓
api/admin/stats → prisma.ts → PostgreSQL
```

