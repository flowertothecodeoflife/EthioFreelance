# EthioFreelance 🇪🇹

Ethiopia's premier freelancing marketplace platform built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- ✅ **User Roles**: Clients, Freelancers, and Admins
- ✅ **Job System**: Fixed price & hourly jobs with milestones
- ✅ **Freelancer Profiles**: Skills, portfolio, ratings & reviews
- ✅ **Search & Filtering**: Advanced job and freelancer search
- ✅ **Real-time Messaging**: Built-in chat with file sharing
- ✅ **Payment Integration**: Chapa payment gateway (ETB)
- ✅ **KYC Verification**: National ID and phone verification
- ✅ **Dispute Resolution**: Admin arbitration panel
- ✅ **Dark Mode**: Full dark theme support
- ✅ **Multi-language**: Amharic, English, Afaan Oromo, Tigrinya

### Ethiopia-Specific Features
- 🇪🇹 Ethiopian Birr (ETB) currency
- 📱 Ethio Telecom phone format (+251)
- 🪪 National ID verification
- 🏙️ Ethiopian cities (Addis Ababa, Mekelle, Hawassa, etc.)
- 💳 Chapa payment integration
- 🎨 Ethiopian traditional pattern background
- 📊 1% commission model (lower than global platforms)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, stats, categories, featured jobs |
| `/jobs` | Job listings with search and filters |
| `/jobs/[id]` | Job detail page with proposal form |
| `/freelancers` | Freelancer directory |
| `/freelancers/[id]` | Freelancer profile with portfolio |
| `/register` | 3-step registration (Info → KYC → Review) |
| `/login` | Email/phone login with Telebirr option |
| `/dashboard` | User dashboard with earnings, jobs, proposals |
| `/post-job` | 3-step job posting flow |
| `/messages` | Real-time messaging interface |
| `/how-it-works` | Platform guide for clients & freelancers |
| `/admin` | Admin dashboard with analytics & dispute management |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **State Management**: React Hooks
- **Theme**: Custom dark mode with localStorage

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd ethio-freelance

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
ethio-freelance/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # User dashboard
│   │   ├── freelancers/       # Freelancer pages
│   │   ├── jobs/              # Job pages
│   │   ├── login/             # Authentication
│   │   ├── messages/          # Messaging
│   │   ├── post-job/          # Job posting
│   │   ├── register/          # Registration
│   │   └── how-it-works/      # Info page
│   ├── components/            # React components
│   │   ├── admin/            # Admin components
│   │   ├── auth/             # Auth forms
│   │   ├── dashboard/        # Dashboard components
│   │   ├── freelancers/      # Freelancer components
│   │   ├── home/             # Homepage sections
│   │   ├── jobs/             # Job components
│   │   ├── messages/         # Chat components
│   │   ├── Footer.tsx        # Site footer
│   │   ├── Navbar.tsx        # Navigation with dark mode
│   │   └── ThemeProvider.tsx # Dark mode context
│   └── app/
│       ├── globals.css       # Global styles + dark mode
│       └── layout.tsx        # Root layout
├── public/                    # Static assets
├── package.json
└── README.md
```

## Dark Mode

Dark mode is implemented with:
- CSS custom properties in `globals.css`
- React Context in `ThemeProvider.tsx`
- localStorage persistence
- Toggle button in Navbar

Toggle dark mode by clicking the moon/sun icon in the navigation bar.

## Ethiopian Design Elements

The homepage hero section features:
- Traditional Ethiopian pattern overlay
- Ethiopian flag colors (green, yellow, red)
- Cultural motifs in the background
- Amharic language support

## Admin Dashboard

Access at `/admin` with features:
- User management (KYC verification)
- Job monitoring
- Dispute resolution panel
- Fraud detection alerts
- Platform analytics
- Payment tracking

## Payment Integration

Chapa payment gateway integration includes:
- Escrow system for milestone payments
- Wallet balance management
- Bank withdrawal options
- 1% platform commission
- ETB currency support

## Future Enhancements

- [ ] Real backend API integration
- [ ] PostgreSQL database setup
- [ ] Actual Chapa API integration
- [ ] SMS notifications via Ethio Telecom
- [ ] Video verification for KYC
- [ ] AI-powered job matching
- [ ] Skill testing system
- [ ] Time tracking for hourly jobs
- [ ] Mobile app (React Native)

## Contributing

This is a demonstration project. For production use, implement:
1. Backend API (Node.js/Express or Next.js API routes)
2. Database (PostgreSQL)
3. Authentication (JWT or NextAuth)
4. Payment gateway integration
5. File upload service
6. Email/SMS notifications

## License

MIT License - feel free to use for your projects.

## Contact

Built for the Ethiopian freelancing community 🇪🇹

---

**Note**: This is a frontend demonstration. Backend integration, database, and payment processing need to be implemented for production use.
