# EthioFreelance - Feature Guide

## 🌓 Dark Mode

**How to use:**
- Click the **Moon/Sun icon** in the top navigation bar
- Theme preference is saved to localStorage
- Works across all pages
- Smooth transitions between themes

**Implementation:**
- CSS custom properties in `globals.css`
- React Context API for state management
- Automatic system preference detection
- Manual toggle override

---

## 🇪🇹 Ethiopian Background Design

**Homepage Hero Section:**
- Traditional Ethiopian pattern overlay
- Ethiopian flag colors (Green, Yellow, Red)
- Geometric patterns inspired by Ethiopian art
- Semi-transparent overlay for readability

**CSS Class:** `.ethiopian-pattern` in `globals.css`

---

## 👨‍💼 Admin Dashboard

**Access:** Navigate to `/admin`

**Features:**

### 1. Overview Tab
- **Platform Stats**: Users, jobs, GMV, disputes
- **Recent Registrations**: New user signups with KYC status
- **Active Disputes**: High-priority cases requiring attention
- **Platform Health**: Verification rates, completion rates
- **Fraud Alerts**: Duplicate accounts, suspicious activity

### 2. Users Tab
- User management interface
- KYC verification status
- Account flagging system
- Bulk operations

### 3. Jobs Tab
- Job monitoring
- Status management
- Category analytics

### 4. Disputes Tab
- Dispute resolution panel
- Evidence submission review
- Client vs Freelancer arbitration
- Priority levels (High, Medium, Low)
- Status tracking (Open, Under Review, Resolved)

### 5. Payments Tab
- Transaction monitoring
- Chapa payment tracking
- Commission calculations
- Withdrawal requests

### 6. Analytics Tab
- Monthly Active Users (MAU)
- New registrations trend
- Jobs posted metrics
- Revenue tracking (ETB)
- Growth percentages

**Admin Actions:**
- ✅ Approve/Reject KYC
- ⚖️ Resolve disputes
- 🚫 Flag suspicious accounts
- 👁️ View user details
- 📊 Export analytics

---

## 🎨 Color Scheme

### Light Mode
- **Primary Green**: `#166534` (Ethiopian green)
- **Accent**: `#16a34a`
- **Background**: `#ffffff`
- **Text**: `#171717`

### Dark Mode
- **Primary Green**: `#22c55e`
- **Background**: `#0f1419`
- **Cards**: `#1a1f2e`
- **Text**: `#e5e7eb`

---

## 📱 Responsive Design

All pages are fully responsive:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Mobile-first approach with:
- Collapsible navigation
- Touch-friendly buttons
- Optimized layouts
- Reduced data display

---

## 🔐 Security Features

### KYC Verification
- National ID upload
- Phone number verification (+251)
- Video verification (optional)
- Verification badges

### Fraud Prevention
- Duplicate account detection
- Suspicious bidding patterns
- Payment fraud monitoring
- Admin review system

### Payment Security
- Escrow system
- Milestone-based releases
- Chapa integration
- 1% platform fee

---

## 🌍 Multi-Language Support

**Supported Languages:**
- 🇬🇧 English
- 🇪🇹 አማርኛ (Amharic)
- 🇪🇹 Afaan Oromo
- 🇪🇹 ትግርኛ (Tigrinya)

**Language Selector:**
- Top navigation bar
- Globe icon dropdown
- Persistent selection

---

## 💬 Messaging System

**Features:**
- Real-time chat interface
- File attachments
- Voice notes (important for low literacy)
- Read receipts
- Online/offline status
- Search conversations
- Mobile responsive

**Access:** `/messages`

---

## 💰 Payment Flow

### For Clients:
1. Post job with budget
2. Set milestones (optional)
3. Fund escrow via Chapa
4. Release payment on approval

### For Freelancers:
1. Submit proposal
2. Get hired
3. Complete milestones
4. Receive payment to Chapa wallet
5. Withdraw to bank

**Supported Methods:**
- Chapa wallet
- Bank transfer
- Telebirr
- Mobile money

---

## 📊 Dashboard Features

### Freelancer Dashboard
- **Earnings**: Total, monthly, pending
- **Active Jobs**: Progress tracking
- **Proposals**: Status monitoring
- **Profile Strength**: Completion percentage
- **Chapa Wallet**: Balance & withdrawal

### Client Dashboard
- **Posted Jobs**: Active, completed
- **Hired Freelancers**: Performance
- **Payments**: Transaction history
- **Messages**: Unread count

---

## 🔍 Search & Filters

### Job Search
- Keyword search
- Category filter
- Location filter
- Budget range
- Job type (Fixed/Hourly)
- Sort options

### Freelancer Search
- Skill search
- Location filter
- Verified only
- Available now
- Rating filter

---

## 📈 Analytics (Admin)

**Metrics Tracked:**
- Gross Merchandise Value (GMV)
- User retention rate
- Job completion rate
- Average project value
- Platform commission
- Dispute resolution time
- KYC verification rate

---

## 🚀 Performance

**Optimizations:**
- Static page generation
- Image optimization
- Code splitting
- Lazy loading
- Minimal JavaScript
- Tailwind CSS purging

**Build Output:**
- 13 pages
- Static (○) and Dynamic (ƒ) routes
- Fast page loads
- SEO optimized

---

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📝 Notes

- Admin dashboard is fully functional (frontend)
- Dark mode works across all pages
- Ethiopian background on homepage hero
- All features are responsive
- Ready for backend integration

**Next Steps for Production:**
1. Connect to PostgreSQL database
2. Implement authentication (JWT/NextAuth)
3. Integrate Chapa API
4. Add SMS notifications
5. Deploy to Vercel/AWS
