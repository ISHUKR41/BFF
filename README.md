# 🏆 Gaming Tournament Platform - Production Ready

A professional gaming tournament website for **BGMI** and **Free Fire** tournaments with complete registration management and admin dashboard.

## 🎮 Features

### **Tournament Management**

- **BGMI Tournaments**: Solo, Duo, Squad modes
- **Free Fire Tournaments**: Solo, Duo, Squad modes
- Real-time slot tracking and availability
- Separate entry fees and prize pools for each game
- QR code payment integration

### **Registration System**

- Multi-step registration forms
- Payment screenshot upload
- WhatsApp contact integration
- Transaction ID verification
- Team/player management

### **Admin Dashboard**

- Complete registration management
- Approve/Reject/Delete registrations
- Bulk operations for multiple registrations
- Search and filter functionality
- Payment verification system
- Activity logging and audit trail
- Tournament reset and QR code management

### **Modern UI/UX**

- Responsive design for all devices
- Dark/Light theme support
- Smooth animations with Framer Motion
- Professional tournament cards
- Real-time countdown timers
- Loading states and error handling

## 🚀 Technology Stack

### **Frontend**

- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Radix UI** for components
- **Framer Motion** for animations
- **Tanstack Query** for data fetching
- **React Hook Form** with Zod validation

### **Backend**

- **Express.js** with TypeScript
- **JWT Authentication** (Vercel-optimized)
- **PostgreSQL** with Neon database
- **Drizzle ORM** for type-safe queries
- **bcrypt** for password hashing

### **Deployment**

- **Vercel** ready configuration
- Serverless functions optimized
- Environment variable support
- Static asset serving

## 🏁 Quick Start

### **Prerequisites**

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Vercel account (for deployment)

### **Local Development**

1. **Clone and Install**

   ```bash
   git clone <your-repo>
   cd BFF
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your database URL and secrets
   ```

3. **Database Setup**

   ```bash
   npm run db:push
   ```

4. **Start Development**

   ```bash
   npm run dev
   ```

5. **Access Application**
   - Homepage: http://localhost:5000
   - BGMI Tournaments: http://localhost:5000/bgmi
   - Free Fire Tournaments: http://localhost:5000/freefire
   - Admin Login: http://localhost:5000/admin/login

### **Default Admin Credentials**

- Username: `admin`
- Password: `admin123`
- ⚠️ **Change immediately after deployment!**

## 🚀 Production Deployment

### **Vercel Deployment**

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy**

   ```bash
   vercel
   ```

3. **Set Environment Variables**

   ```bash
   # Required environment variables in Vercel dashboard:
   DATABASE_URL=postgresql://your_neon_connection
   JWT_SECRET=your-super-secure-secret-key
   JWT_EXPIRES_IN=24h
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

4. **Final Deploy**
   ```bash
   vercel --prod
   ```

## 📊 Tournament Configuration

### **BGMI Tournaments**

| Mode  | Max Slots | Entry Fee | Winner Prize | Runner Up | Per Kill |
| ----- | --------- | --------- | ------------ | --------- | -------- |
| Solo  | 100       | ₹20       | ₹350         | ₹250      | ₹9       |
| Duo   | 50        | ₹40       | ₹350         | ₹250      | ₹9       |
| Squad | 25        | ₹80       | ₹350         | ₹250      | ₹9       |

### **Free Fire Tournaments**

| Mode  | Max Slots | Entry Fee | Winner Prize | Runner Up | Per Kill |
| ----- | --------- | --------- | ------------ | --------- | -------- |
| Solo  | 48        | ₹20       | ₹350         | ₹150      | ₹5       |
| Duo   | 24        | ₹40       | ₹350         | ₹150      | ₹5       |
| Squad | 12        | ₹80       | ₹350         | ₹150      | ₹5       |

## 🔧 API Documentation

### **Public Endpoints**

- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:gameType/:tournamentType` - Get specific tournament
- `POST /api/registrations` - Create registration
- `GET /api/health` - Health check

### **Admin Endpoints** (JWT Required)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/validate` - Validate token
- `GET /api/registrations` - Get all registrations
- `PATCH /api/registrations/:id` - Update registration status
- `DELETE /api/registrations/:id` - Delete registration
- `POST /api/registrations/bulk/approve` - Bulk approve
- `POST /api/registrations/bulk/reject` - Bulk reject
- `POST /api/registrations/bulk/delete` - Bulk delete

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention
- Input validation with Zod
- CORS configuration
- Rate limiting ready
- Environment variable protection

## 📱 Mobile Responsive

- Fully responsive design
- Touch-friendly interface
- Mobile-optimized forms
- Swipe gestures support
- Progressive Web App ready

## 🛠 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push database schema
npm run db:generate  # Generate migrations
npm run check        # Type checking
```

## 📂 Project Structure

```
├── client/          # Frontend React app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities and config
├── server/          # Backend Express app
│   ├── database.ts      # Database connection
│   ├── storage-improved.ts  # Data layer
│   ├── routes-improved.ts   # API routes
│   └── index-improved.ts    # Server setup
├── shared/          # Shared types and schemas
└── attached_assets/ # Static assets
```

## 🔄 Data Flow

1. **Registration**: User fills form → Validation → Database storage → Slot increment
2. **Admin Review**: Admin views → Approve/Reject → WhatsApp notification
3. **Tournament Management**: Admin manages → Real-time updates → User visibility

## 🎯 Key Benefits

### **For Tournament Organizers**

- Complete registration management
- Real-time slot tracking
- Payment verification system
- Bulk operations for efficiency
- Detailed activity logging

### **For Players**

- Easy registration process
- Real-time slot availability
- Mobile-friendly interface
- WhatsApp integration
- Transparent tournament info

### **Technical Benefits**

- Serverless-ready architecture
- Real-time data synchronization
- Type-safe development
- Modern tech stack
- Production-grade security

## 📞 Support & Maintenance

### **Monitoring**

- Health check endpoint: `/api/health`
- Activity logs in admin panel
- Error tracking and logging

### **Backup & Recovery**

- Database backups via Neon
- Activity log audit trail
- Admin action logging

## 🏆 Production Features

✅ **Vercel Optimized** - Perfect for serverless deployment  
✅ **Data Persistence** - No data loss on refresh  
✅ **Real-time Sync** - Tournament slots always accurate  
✅ **Mobile Ready** - Works on all devices  
✅ **Admin Dashboard** - Complete management system  
✅ **Payment System** - QR code integration  
✅ **Security** - JWT authentication & validation  
✅ **Scalable** - Handles multiple concurrent users  
✅ **Professional UI** - Modern tournament platform

## 📄 License

MIT License - Feel free to use for commercial tournament hosting!

---

**Ready to host professional gaming tournaments!** 🎮🏆
