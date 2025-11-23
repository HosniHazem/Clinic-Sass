# MedFlow - Medical Clinic Management SaaS

A comprehensive full-stack SaaS application for managing medical clinics, built with Next.js 14, React, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

### Multi-Role System
- **Admin**: Clinic management, staff control, service configuration
- **Doctor**: Patient consultations, prescriptions, appointment management
- **Receptionist**: Patient registration, appointment scheduling, billing
- **Patient**: Self-service portal for bookings and payments

### Core Modules
- ✅ Authentication & RBAC (Role-Based Access Control)
- ✅ Patient Management (Complete CRUD with medical history)
- ✅ Appointment Scheduling (Calendar view with conflict detection)
- ✅ Consultation & Medical Records
- ✅ Prescription Management with PDF generation
- ✅ Billing & Invoicing
- ✅ Payment Processing (Stripe integration)
- ✅ Patient Self-Service Portal
- ✅ Multi-tenant Architecture (clinic isolation)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Validation**: Zod
- **PDF Generation**: jsPDF
- **Payments**: Stripe (test mode)
- **Deployment**: Vercel (frontend) + Railway/Render (database)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn
- Stripe account (for payments)

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd medflow-saas
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/medflow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_key_here"
STRIPE_SECRET_KEY="sk_test_your_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database with demo data
npx prisma db seed
```

Quick local dev checklist:

```bash
# copy env example
cp .env.example .env
# install deps
npm install
# generate prisma client
npx prisma generate
# run migrations and seed
npx prisma migrate dev --name init
npx prisma db seed
# start dev server
npm run dev
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 Demo Accounts

After seeding the database, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medflow.com | password123 |
| Doctor | dr.smith@medflow.com | password123 |
| Doctor | dr.johnson@medflow.com | password123 |
| Receptionist | receptionist@medflow.com | password123 |
| Patient | patient1@example.com | password123 |
| Patient | patient2@example.com | password123 |

## 📁 Project Structure

```
medflow-saas/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── admin/             # Admin pages
│   │   ├── doctor/            # Doctor pages
│   │   ├── receptionist/      # Receptionist pages
│   │   ├── patient/           # Patient pages
│   │   └── portal/            # Patient portal
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── forms/             # Form components
│   │   └── layout/            # Layout components
│   ├── lib/
│   │   ├── auth.ts            # Authentication config
│   │   ├── prisma.ts          # Prisma client
│   │   └── utils.ts           # Utility functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
└── package.json
```

## 🗄️ Database Schema

### Main Models

- **User**: Authentication and user info
- **Clinic**: Multi-tenant clinic data
- **Patient**: Patient profiles and medical history
- **Doctor**: Doctor profiles and availability
- **Service**: Medical services catalog
- **Appointment**: Appointment scheduling
- **Consultation**: Medical consultations
- **Prescription**: Prescriptions and medications
- **Invoice**: Billing and invoices
- **Payment**: Payment tracking

## 🔐 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT-based session management
- Role-based access control (RBAC)
- Multi-tenant data isolation
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS protection
- CSRF protection

## 🏷️ Multi-Tenancy & Tenant Isolation

- This app uses `clinicId` as the tenant identifier. Middleware injects an `x-clinic-id` header on authenticated requests so server-side API routes can enforce tenant boundaries.
- When creating or querying data, always scope Prisma queries by `clinicId` to prevent cross-tenant access.
- For production, consider enabling PostgreSQL row-level security (RLS) and mapping session-based tenant verification to RLS policies for stronger guarantees.


## 🎨 UI Components

Built with shadcn/ui, including:
- Button, Input, Label
- Card, Dialog, Sheet
- Toast notifications
- Calendar, DatePicker
- Select, Checkbox, Radio
- Table, Tabs
- And more...

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interfaces
- Accessible (WCAG 2.1 AA)

## 🚢 Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Railway/Render (Database)

1. Create a PostgreSQL database
2. Get the connection URL
3. Update DATABASE_URL in Vercel
4. Run migrations: `npx prisma migrate deploy`

## 📝 Development Workflow

### Sprint 1: Foundation (Week 1)
- ✅ Setup project structure
- ✅ Authentication system
- ✅ Basic dashboards

### Sprint 2: Core Entities (Week 2)
- ✅ Patient management
- ✅ Services catalog
- ✅ Appointment system

### Sprint 3: Medical Features (Week 3)
- 🔄 Consultation workflow
- 🔄 Prescription management
- 🔄 PDF generation

### Sprint 4: Billing & Portal (Week 4)
- 🔄 Invoice generation
- 🔄 Stripe integration
- 🔄 Patient portal

### Sprint 5: Polish & Deploy (Week 5)
- 🔄 Testing
- 🔄 Bug fixes
- 🔄 Deployment
- 🔄 Documentation

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run linter
npm run lint
```

## 🤝 Contributing

This is an educational project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use for educational purposes

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Check the documentation
- Review the demo video

## 🎯 Learning Objectives

This project covers:
- Full-stack development with Next.js
- Database design and Prisma ORM
- Authentication and authorization
- RESTful API design
- State management in React
- Form handling and validation
- Payment integration
- PDF generation
- Multi-tenant architecture
- Deployment and DevOps

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Stripe Documentation](https://stripe.com/docs)

## 🎓 Academic Context

This project fulfills the requirements for the React course project, covering:
- Software design and architecture
- Full-stack development
- Security best practices
- Database design
- UML diagrams
- User interface design
- Testing and deployment

## ⚠️ Important Notes

1. **Demo Data**: Use seed script for testing
2. **Stripe**: Use test mode keys only
3. **Security**: Change all secrets in production
4. **Database**: Regular backups recommended
5. **HIPAA**: This is a demo - not production-ready for real medical data

## 🏆 Evaluation Criteria

- ✅ Design quality (UML, ERD, mockups): 25%
- ✅ Code & architecture: 25%
- ✅ Functionality (MVP): 30%
- ✅ UX/UI and ergonomics: 10%
- ✅ Documentation & demo: 10%

---

Built with ❤️ for learning and education
