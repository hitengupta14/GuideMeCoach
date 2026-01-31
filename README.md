# GuideMeCoach

A structured exercise knowledge platform with personalized training engine for India.

## 🎉 Latest Updates - Phase 1 & 2 Complete!

**Status:** ✅ **Production Ready**

### New Features (January 2026)
- ✅ **Exercise Data Integrity** - Admin approval system for quality control
- ✅ **AI Usage Quotas** - Prevent unlimited AI costs with per-feature limits
- ✅ **Pricing Page** - 3 tiers (Free, Premium ₹249/mo, Yearly ₹2,490/yr)
- ✅ **Upgrade Modals** - Convert free users at point of need
- ✅ **Mobile Parity** - All features implemented for React Native app
- ✅ **Admin Dashboard** - Exercise management and approval workflow

📚 **Documentation:**
- [Phase 1 & 2 Features](./PHASE_1_2_FEATURES.md) - Complete feature map
- [Implementation Report](./IMPLEMENTATION_COMPLETE_REPORT.md) - Full technical details
- [Mobile Guide](./mobile/MOBILE_IMPLEMENTATION_COMPLETE.md) - Mobile usage examples

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd GuideMeCoach
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and update your database URL with the correct port:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:YOUR_PORT/guidemecoach"
```

**Note**: Check which port your PostgreSQL is running on. If using Postgres.app, it might be on port 3000 instead of the default 5432.

4. Generate and apply database schema
```bash
# Generate migration files
npm run db:generate

# Apply migrations to database (run the generated SQL file)
PGPASSWORD=YOUR_PASSWORD psql -h localhost -p YOUR_PORT -U postgres -d guidemecoach -f drizzle/0000_*.sql
```

5. Seed the database with initial data
```bash
npm run db:seed
```

6. Start the development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL
- **State Management**: React Query

## 🗂️ Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── api/          # API routes
│   └── ...
├── db/               # Database schema and connection
│   ├── schema.ts     # Drizzle schema
│   ├── index.ts      # Database client
│   └── seed.ts       # Seed script
└── components/       # React components (to be added)
```

## 🎯 Features

### MVP (Current) - ✅ 100% COMPLETE
- ✅ Exercise library with 100+ exercises
- ✅ Muscle-wise navigation (15+ muscle groups)
- ✅ Detailed exercise pages with step-by-step instructions
- ✅ Search and advanced filtering
- ✅ Video integration (31+ exercises with YouTube embeds)
- ✅ Exercise alternatives system (easier, harder, equipment-free)
- ✅ Medical safety flags and benefits
- ✅ Responsive design (mobile-first)
- ✅ SEO optimization

**🚀 Status: Production-ready for soft launch!**

See [MVP_COMPLETION_STATUS.md](MVP_COMPLETION_STATUS.md) for detailed completion status.

### Upcoming
- User authentication
- Personalized workout plans
- Progress tracking
- AI chatbot assistance
- Premium features

## 📖 API Endpoints

### Exercises
- `GET /api/exercises` - List all exercises with filters
- `GET /api/exercises/:id` - Get single exercise
- `POST /api/exercises` - Create exercise (admin)
- `PATCH /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Muscle Groups
- `GET /api/muscles` - List muscle groups
- `GET /api/muscles/:id/exercises` - Get exercises for muscle

## 🛠️ Development

### Database Commands

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (DB GUI)
npm run db:studio
```

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. Contact the owner for contribution guidelines.
