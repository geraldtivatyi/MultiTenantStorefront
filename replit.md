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
- July 5, 2025: Implemented WhatsApp Business API integration:
  - Created WhatsApp service for sending order notifications to vendors
  - Added WhatsApp phone number field to tenants table for notification setup
  - Integrated automatic notifications when orders are paid (via Paystack webhook)
  - Added WhatsApp settings section to vendor dashboard for phone number configuration
  - Created webhook endpoints for WhatsApp Business API integration
  - Added test endpoint for platform administrators to test WhatsApp messaging
  - System gracefully handles missing WhatsApp credentials with proper logging
- July 5, 2025: Implemented comprehensive email notification system using SendGrid:
  - Created email service with professional HTML templates for vendor and customer notifications
  - Integrated automatic email notifications when orders are paid (via Paystack webhook)
  - Vendors receive detailed order notifications with customer and item information
  - Customers receive order confirmation emails with complete order details
  - Added email configuration and testing capabilities to admin dashboard settings
  - System gracefully handles missing SendGrid credentials and continues operation
  - Email notifications complement WhatsApp notifications for complete vendor communication
- July 5, 2025: Implemented comprehensive tenant store management for spaza shops and informal businesses:
  - Added full tenant management interface in admin dashboard with create, read, update functionality
  - Designed onboarding process specifically for South African informal businesses (spaza shops, street vendors, etc.)
  - Business type categorization: spaza shop, street vendor, home business, market stall, online store, other
  - Simplified registration requiring only essential information: store name, owner details, basic contact info
  - Automatic subdomain generation and user account creation for store owners
  - Enhanced tenant schema with business type, description, address, and owner contact details
  - Store owners automatically get tenant_owner role and access to vendor dashboard
  - Admin can manage all stores from centralized interface with easy editing and store visiting capabilities
- July 6, 2025: Centralized Pudo API key management for simplified vendor experience:
  - Removed vendor-specific Pudo API key field from tenant configuration 
  - Implemented centralized PUDO_API_KEY environment variable for all stores
  - Updated Pudo service to use single API key instead of per-vendor keys
  - Modified vendor dashboard to remove API key input field with informative message
  - Simplified delivery configuration - vendors only need to set collection address and preferred locker
  - All Pudo functionality (locker fetching, rate calculation) now works seamlessly for all vendors
  - Enhanced checkout flow with delivery method selection and dynamic pricing remains functional
- July 6, 2025: Improved vendor delivery configuration interface:
  - Replaced complex JSON address input with simple individual fields (street, suburb, city, postal code)
  - Created dropdown for preferred locker selection showing location names with addresses
  - Implemented sample locker data for major South African cities (PUDO API lacks public lockers endpoint)
  - Added proper loading states and error handling for locker selection
  - Maintained backward compatibility for existing JSON address data
  - Collection address automatically converted to JSON format when saving
- July 6, 2025: Successfully integrated real PUDO API with Bearer token authentication:
  - Resolved authentication issues using correct Bearer token from Postman configuration
  - Implemented proper data mapping from PUDO API format to application format
  - System now fetches 410+ real locker locations across South Africa instead of sample data
  - Added fallback system that gracefully handles API failures with sample data
  - Centralized Bearer token management via PUDO_BEARER_TOKEN environment variable
  - Vendor dashboard now displays authentic locker locations with real addresses and coordinates
- July 6, 2025: Completed comprehensive vendor dashboard functionality:
  - Built complete Orders management with search, filtering, sorting, and analytics cards showing real-time order data
  - Created Analytics dashboard with key business metrics, revenue calculations, and performance insights 
  - Implemented full Settings management with store information updates, WhatsApp notifications, and security options
  - Added proper loading states, error handling, and responsive design throughout all dashboard sections
  - Fixed collection address display bug that showed '[object Object]' instead of individual address fields
  - Enhanced address parsing logic to handle both JSON string and object formats with proper error handling
  - All vendor dashboard sections now integrate seamlessly with existing API endpoints for authentic data display
- July 7, 2025: Implemented comprehensive animated loading skeleton system for improved user experience:
  - Created reusable skeleton components: ProductGridSkeleton, CartItemSkeleton, OrderCardSkeleton, StatsGridSkeleton, TableSkeleton
  - Applied skeleton loading states throughout storefront, cart, search, vendor dashboard, and order management pages
  - Replaced basic loading text with elegant animated skeleton placeholders for professional visual feedback
  - Enhanced authentication flow with AuthLoadingScreen component for login, logout, and signup processes
  - Added application-wide authentication loading during initial auth check and auto-redirects
  - Improved user experience with smooth loading transitions instead of blank screens or basic loading text
- July 7, 2025: Enhanced checkout flow with Pudo delivery validation requirements:
  - Added form validation to require Pudo locker selection when Pudo delivery method is chosen
  - Implemented payment button disabling until all Pudo delivery requirements are completed
  - Added helpful validation messages to guide users through Pudo locker selection process
  - Enhanced checkout form schema with conditional validation for delivery method requirements
  - Prevents payment processing until all delivery details are properly configured for Pudo orders
- July 7, 2025: Fixed payment processing errors and enabled test mode for client testing:
  - Corrected API request parameter order causing checkout failures (url, method, data)
  - Enhanced error handling with detailed error messages for better debugging
  - Added test mode notification in payment section with test card information
  - Improved payment flow validation and user feedback during processing
  - Enabled Paystack test mode for safe client testing without real charges
- July 7, 2025: Fixed My Orders payment completion functionality with improved user experience:
  - Resolved issue where all "Complete Payment" buttons showed "Processing" when only one should
  - Implemented per-order loading state using Set data structure for individual order tracking
  - Integrated Paystack popup for payment completion instead of redirecting to new tab
  - Added test mode notification with test card information on My Orders page
  - Enhanced payment completion flow with proper error handling and success feedback
  - Fixed amount conversion issue for Paystack API (convert to kobo as integer)
  - Changed payment currency from ZAR to NGN (Nigerian Naira) for Paystack test mode compatibility