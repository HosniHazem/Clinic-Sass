# MedFlow - Quick Start Guide

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18.x or higher installed
- [ ] PostgreSQL 14.x or higher installed and running
- [ ] npm or yarn package manager
- [ ] Git (optional, for version control)
- [ ] A code editor (VS Code recommended)

## Step-by-Step Setup

### 1. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database:
```sql
CREATE DATABASE medflow;
```

3. Note your database credentials:
   - Username (usually 'postgres')
   - Password
   - Port (usually 5432)

#### Option B: Cloud Database (Recommended for deployment)

Use one of these providers:
- **Railway**: https://railway.app (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Supabase**: https://supabase.com (Free tier available)

### 2. Project Setup

1. Extract the project files
```bash
cd medflow-saas
```

2. Install dependencies
```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- Prisma
- NextAuth.js
- Tailwind CSS
- And more...

### 3. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and update these values:

```env
# Database - Replace with your actual database URL
DATABASE_URL="postgresql://username:password@localhost:5432/medflow"

# NextAuth - Generate a random secret
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Stripe (Optional for payment testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_publishable_key"
STRIPE_SECRET_KEY="your_secret_key"
```

To generate a secure NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

### 4. Database Initialization

1. Generate Prisma Client:
```bash
npx prisma generate
```

2. Run database migrations:
```bash
npx prisma migrate dev --name init
```

3. Seed the database with demo data:
```bash
npx prisma db seed
```

This creates:
- 1 Demo Clinic
- 1 Admin user
- 2 Doctors
- 1 Receptionist
- 2 Patients
- 6 Sample Services

### 5. Run the Application

Start the development server:
```bash
npm run dev
```

The application will be available at: http://localhost:3000

### 6. Login and Test

Use these demo credentials:

**Admin Account:**
- Email: admin@medflow.com
- Password: password123

**Doctor Account:**
- Email: dr.smith@medflow.com
- Password: password123

**Patient Account:**
- Email: patient1@example.com
- Password: password123

## Troubleshooting

### Database Connection Issues

If you see "Can't reach database server":

1. Check if PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Ensure database exists
4. Check firewall settings

### Port Already in Use

If port 3000 is busy:
```bash
npm run dev -- -p 3001
```

### Prisma Issues

If you encounter Prisma errors:
```bash
# Clear Prisma cache
npx prisma generate --force

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Node Modules Issues

If dependencies aren't installing properly:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Explore the Dashboard**: Login and navigate through different sections
2. **Add Test Data**: Create patients, schedule appointments
3. **Review Code**: Check out the project structure
4. **Customize**: Modify colors, branding, features
5. **Deploy**: Follow deployment guide in README.md

## Development Tools

### Prisma Studio (Database GUI)
```bash
npx prisma studio
```
Opens at http://localhost:5555

### View Database Schema
```bash
npx prisma db pull
```

### Format Code
```bash
npm run lint
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create new migration
npx prisma db seed       # Run seed script
npx prisma migrate reset # Reset database

# Code Quality
npm run lint             # Run ESLint
```

## Project Structure Overview

```
medflow-saas/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── auth/         # Auth pages
│   │   └── dashboard/    # Main app
│   ├── components/       # React components
│   │   └── ui/           # UI components
│   └── lib/              # Utilities
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
└── public/               # Static files
```

## Getting Help

- Check README.md for detailed documentation
- Review code comments
- Check console for error messages
- Verify all environment variables are set

## Security Notes

⚠️ **Important for Production:**

1. Change all default passwords
2. Use strong NEXTAUTH_SECRET
3. Enable HTTPS
4. Use production database
5. Set secure environment variables
6. Enable CORS protection
7. Implement rate limiting

## Ready to Code!

You're all set! Start developing your medical clinic management system.

Happy coding! 🚀
