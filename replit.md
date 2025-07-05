# Multi-Tenant E-commerce Platform

## Overview
This is a full-stack multi-tenant e-commerce platform built with React, Express.js, and PostgreSQL. The system allows multiple stores to operate independently under different subdomains while sharing the same infrastructure. Each tenant has their own isolated product catalog, orders, and storefront customization.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless
- **Session Management**: PostgreSQL-based sessions
- **Payment Integration**: Paystack payment gateway

### Multi-Tenant Strategy
- **Isolation Level**: Row-level security using tenant IDs
- **Subdomain Routing**: Automatic tenant identification via subdomain extraction
- **Shared Database**: Single database with tenant isolation at the application layer

## Key Components

### Database Schema
- **Tenants**: Store configuration and branding information
- **Users**: Admin and customer accounts with tenant association
- **Products**: Tenant-isolated product catalog
- **Cart Items**: Session-based shopping cart with tenant context
- **Orders**: Complete order management with payment tracking
- **Payment Transactions**: Paystack payment record keeping

### Authentication & Authorization
- **Tenant Middleware**: Automatic tenant resolution from subdomain
- **Admin Bypass**: Special routing for platform administration
- **Session Management**: PostgreSQL-backed sessions for scalability

### Payment Processing
- **Primary Gateway**: Paystack integration for Nigerian market
- **Webhook Support**: Automatic payment verification and order updates
- **Multiple Payment Methods**: Card, bank transfer, and USSD support

### API Structure
- `/api/storefront/*`: Tenant-specific storefront operations
- `/api/cart/*`: Shopping cart management
- `/api/orders/*`: Order processing and tracking
- `/api/admin/*`: Platform administration (bypasses tenant middleware)
- `/api/payment/*`: Payment processing and webhooks

## Data Flow

### Customer Journey
1. Customer visits subdomain (e.g., store.platform.com)
2. Tenant middleware identifies and validates the store
3. Storefront loads with tenant-specific branding and products
4. Cart operations are session-based with tenant isolation
5. Checkout initiates Paystack payment flow
6. Webhook confirms payment and creates order record

### Admin Operations
1. Admin accesses platform through special admin routes
2. Can create and manage multiple tenant stores
3. Add products to specific tenant catalogs
4. Monitor orders and payments across all tenants

### Payment Flow
1. Customer initiates checkout with order details
2. System creates Paystack transaction with metadata
3. Customer completes payment on Paystack interface
4. Webhook receives payment confirmation
5. Order status updated and customer notified

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework

### Payment Integration
- **Paystack**: Payment gateway for African markets
- **Webhook verification**: Crypto-based payload validation

### Development Tools
- **Vite**: Fast development server and build tool
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Build Process
1. Client-side build generates static assets via Vite
2. Server-side build bundles Express application with esbuild
3. Database migrations applied via Drizzle Kit
4. Environment variables configure database and payment settings

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **PAYSTACK_SECRET_KEY**: Payment gateway authentication
- **PAYSTACK_PUBLIC_KEY**: Client-side payment integration
- **PAYSTACK_WEBHOOK_SECRET**: Webhook payload verification

### Production Considerations
- Serverless-compatible architecture
- Efficient database connection pooling
- Static asset serving optimized for CDN deployment
- Webhook endpoint secured with signature verification

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- June 28, 2025: Initial multi-tenant e-commerce platform setup
- June 28, 2025: Updated currency from USD to South African Rand (ZAR)
- June 28, 2025: Changed demo store theme to "Creative Crafts Studio" - arts and crafts products
- June 29, 2025: Completed full e-commerce page structure including:
  - About page with company story and values
  - Contact page with working contact form
  - Search/Products page with filtering and sorting
  - Privacy Policy with comprehensive data protection info
  - Terms of Service with complete legal terms
  - Shipping Information with delivery options and policies
  - Updated footer and header navigation links
  - Functional user dropdown with My Orders and Account Settings
- June 29, 2025: Implemented comprehensive Account Settings with:
  - Profile management (first name, last name, phone)
  - Multiple address management with default address support
  - Password change functionality with validation
  - User preferences with email notifications and privacy settings
- June 29, 2025: Enhanced My Orders page with full functionality:
  - Order filtering by status and search capabilities
  - Expandable order details showing individual items
  - Complete payment option for pending orders
  - Reorder functionality to add items back to cart
  - Order status tracking with visual indicators
- June 29, 2025: Completed comprehensive Admin Dashboard with all sections:
  - Dashboard Overview with real-time stats and tenant activity
  - Tenant Stores management with creation and configuration
  - Products management with tenant-specific catalogs
  - Payments section with transaction monitoring and revenue tracking
  - Settings section with platform configuration and system status
  - Added admin API endpoints for stats, orders, and product management
- July 5, 2025: Implemented role-based access control system:
  - Added user role field with three levels: platform_admin, tenant_owner, customer
  - Created separate Vendor Dashboard for store owners (/vendor route)
  - Platform Admin button only visible to platform administrators
  - Vendor Dashboard button only visible to tenant owners
  - Role-based middleware for API endpoint protection
  - Vendor dashboard shows tenant-specific stats, orders, and products
  - Mobile navigation organized with hamburger menu containing all functions
- July 5, 2025: Implemented automatic dashboard redirection:
  - Platform administrators automatically redirected to /admin after login
  - Store owners (tenant_owner role) automatically redirected to /vendor after login
  - Regular customers remain on homepage after login
  - Role-specific welcome messages displayed during login
  - Enhanced auth status endpoint to include role and tenant information