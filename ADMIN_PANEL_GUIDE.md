# Admin Panel Implementation Guide

## Overview
The GuideMeCoach admin panel is a comprehensive administrative interface for managing users, content, analytics, and system health. This implementation follows a phased approach with Phase 1 (Critical) features fully implemented.

## 🎉 Completed Features (Phase 1)

### 1. Admin Authentication & Authorization
- **Location**: `src/lib/admin-auth.ts`
- **Features**:
  - Three admin roles: Super Admin, Content Admin, Support Admin
  - Role-based permissions system
  - Admin activity logging
  - Middleware for protecting admin routes

### 2. Admin Dashboard
- **Location**: `src/app/admin/page.tsx`
- **Features**:
  - Real-time metrics overview
  - User growth charts
  - System health monitoring
  - Recent activity feed
  - Key performance indicators

### 3. User Management
- **Location**: `src/app/admin/users/page.tsx`
- **Features**:
  - Search and filter users
  - View user details and activity
  - Premium/Admin status indicators
  - Email verification status
  - Pagination support
  - User actions (edit, delete planned)

### 4. Exercise Library Management
- **Location**: `src/app/admin/exercises/page.tsx`
- **Features**:
  - Browse all exercises
  - Search and filter by category/difficulty
  - View exercise details
  - Edit/delete exercises (planned)
  - Add new exercises button

### 5. Analytics Dashboard
- **Location**: `src/app/admin/analytics/page.tsx`
- **Features**:
  - User metrics (total, active, premium)
  - Workout statistics
  - Plan creation metrics
  - AI usage overview
  - Visual charts and graphs

### 6. AI Monitoring
- **Location**: `src/app/admin/ai-monitoring/page.tsx`
- **Features**:
  - Total AI requests tracking
  - Success rate monitoring
  - Cost analysis
  - Token usage statistics
  - Feature-wise breakdown
  - Recent request logs

### 7. System Health Dashboard
- **Component**: `src/components/admin/SystemHealth.tsx`
- **Features**:
  - Database connection status
  - API server health
  - AI service status
  - Email service status
  - Auto-refresh every 30s

## 📁 Project Structure

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx                 # Admin layout with sidebar
│       ├── page.tsx                   # Main dashboard
│       ├── users/
│       │   └── page.tsx              # User management
│       ├── exercises/
│       │   └── page.tsx              # Exercise management
│       ├── analytics/
│       │   └── page.tsx              # Analytics dashboard
│       └── ai-monitoring/
│           └── page.tsx              # AI monitoring
│
├── components/admin/
│   ├── AdminHeader.tsx               # Top navigation
│   ├── AdminSidebar.tsx              # Side navigation
│   ├── DashboardStats.tsx            # Stats cards
│   ├── UserGrowthChart.tsx           # User growth visualization
│   ├── SystemHealth.tsx              # System status
│   ├── ActivityFeed.tsx              # Recent admin actions
│   ├── UserManagementTable.tsx       # User table
│   ├── ExerciseManagementTable.tsx   # Exercise table
│   ├── AnalyticsOverview.tsx         # Analytics cards
│   ├── WorkoutAnalytics.tsx          # Workout charts
│   ├── UserEngagementMetrics.tsx     # Engagement stats
│   ├── AIUsageStats.tsx              # AI stats cards
│   ├── AIRequestsChart.tsx           # AI requests chart
│   ├── AIFeatureBreakdown.tsx        # AI feature usage
│   └── RecentAIRequests.tsx          # Recent AI logs
│
├── lib/
│   └── admin-auth.ts                 # Admin authentication utilities
│
└── db/
    └── schema.ts                     # Database schema with admin tables
```

## 🗄️ Database Schema

### New Tables Added

#### `admin_activity_logs`
Tracks all admin actions for audit purposes.
```typescript
{
  id: uuid
  adminId: uuid (references users)
  action: string
  targetType: string
  targetId: string
  metadata: jsonb
  createdAt: timestamp
}
```

#### `system_metrics`
Stores system performance and usage metrics.
```typescript
{
  id: uuid
  metricType: string
  metricName: string
  value: integer
  metadata: jsonb
  recordedAt: timestamp
}
```

#### `ai_usage_logs`
Tracks all AI API calls for cost monitoring.
```typescript
{
  id: uuid
  userId: uuid (nullable)
  feature: string
  model: string
  tokensUsed: integer
  estimatedCost: integer (in cents)
  responseTime: integer (in ms)
  success: boolean
  errorMessage: string
  createdAt: timestamp
}
```

### Modified Tables

#### `users` table additions:
- `isAdmin`: boolean (default false)
- `adminRole`: enum ('super_admin', 'content_admin', 'support_admin')

## 🔐 Admin Roles & Permissions

### Super Admin
- **Full System Access**: Can do everything
- User management
- Exercise management
- Subscription management
- Analytics access
- Admin user management
- System settings

### Content Admin
- Exercise library management
- Analytics viewing
- **No** user management
- **No** subscription management
- **No** admin management

### Support Admin
- User management
- Subscription management
- Analytics viewing
- **No** exercise management
- **No** admin management

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
# Apply the admin schema migration
npm run db:migrate

# Or manually run the SQL file
psql your_database < drizzle/0003_admin_panel_schema.sql
```

### 2. Create Your First Admin User
You'll need to manually set a user as admin in the database:

```sql
-- Make a user an admin
UPDATE users 
SET is_admin = true, admin_role = 'super_admin' 
WHERE email = 'your-email@example.com';
```

### 3. Install Required Dependencies
Make sure you have these packages:
```bash
npm install chart.js react-chartjs-2 @headlessui/react @heroicons/react date-fns
```

### 4. Access the Admin Panel
Navigate to `/admin` in your browser. You must be logged in as an admin user.

## 📊 API Endpoints

### Analytics Endpoints
- `GET /api/admin/analytics/user-growth` - User growth over 30 days
- `GET /api/admin/analytics/workouts` - Workout activity over 7 days
- `GET /api/admin/analytics/ai-requests` - AI requests over 30 days

### Admin Endpoints
- `GET /api/admin/system/health` - System health check
- `GET /api/admin/activity-logs?limit=10` - Recent admin activities
- `GET /api/admin/ai-logs?limit=20` - Recent AI requests

## 🎨 UI Components

All admin components use:
- **Tailwind CSS** for styling
- **Heroicons** for icons
- **Chart.js** for data visualization
- **Dark mode** support
- **Responsive** design

## 🔒 Security Features

1. **Role-Based Access Control**: Different permissions for different admin roles
2. **Activity Logging**: All admin actions are logged
3. **Protected Routes**: Admin middleware prevents unauthorized access
4. **Audit Trail**: Complete history of admin actions

## 📈 Monitoring & Analytics

The admin panel tracks:
- User growth and engagement
- Workout activity patterns
- AI usage and costs
- System health and performance
- Feature adoption rates

## 🛠️ Future Enhancements (Phase 2 & 3)

### Phase 2 (Important)
- [ ] Revenue & Subscription Management
- [ ] Email Campaign Tools
- [ ] Advanced Security Features
- [ ] Batch Operations

### Phase 3 (Nice to Have)
- [ ] Advanced Reporting & BI
- [ ] A/B Testing Framework
- [ ] Predictive Analytics
- [ ] Advanced Customization

## 🐛 Troubleshooting

### Issue: Admin panel shows "Unauthorized"
**Solution**: Make sure your user has `is_admin = true` in the database.

### Issue: Charts not loading
**Solution**: Verify chart.js and react-chartjs-2 are installed.

### Issue: API endpoints returning 500
**Solution**: Check database connection and ensure migrations are run.

## 📝 Development Notes

- All admin pages are server components by default for better performance
- Client components are marked with 'use client' directive
- API routes are protected (add actual auth middleware in production)
- Charts use Chart.js with automatic responsive sizing
- Tables include pagination for large datasets

## 🚦 Testing Checklist

- [ ] Can access admin panel as admin user
- [ ] Cannot access admin panel as regular user
- [ ] User management table loads and filters work
- [ ] Exercise management table loads and filters work
- [ ] Analytics dashboard shows correct metrics
- [ ] AI monitoring displays usage data
- [ ] System health checks work
- [ ] Activity feed shows recent actions
- [ ] Charts render correctly
- [ ] Dark mode works throughout

## 💡 Best Practices

1. **Always log admin actions** using `logAdminActivity()` from `admin-auth.ts`
2. **Check permissions** before allowing sensitive operations
3. **Validate all inputs** from admin forms
4. **Use transactions** for multi-step operations
5. **Cache frequently accessed** data
6. **Monitor AI costs** regularly
7. **Review activity logs** periodically

## 📞 Support

For issues or questions about the admin panel:
1. Check the troubleshooting section above
2. Review the admin.md specification
3. Check database schema and migrations
4. Verify all dependencies are installed

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Phase 1 Complete ✅
