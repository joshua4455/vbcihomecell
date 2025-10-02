# Priesthood Management Platform

A comprehensive web application for managing church home cells, zones, and leadership hierarchy. Built with modern React, TypeScript, and Tailwind CSS.

## 🚀 Features

### **Core Functionality**
- **Role-based Authentication System** - Secure login with different access levels
- **Multi-role Dashboards** - Tailored interfaces for Cell Leaders, Zone Leaders, and Super Admins
- **Meeting Management** - Record attendance, offerings, and visitor information
- **Member Management** - Add, edit, and manage cell members
- **Real-time Data** - Live updates and persistent storage using localStorage
- **Responsive Design** - Mobile-friendly interface for all devices

### **User Roles & Permissions**

#### **Cell Leader**
- Record weekly meetings with attendance tracking
- Manage cell members (add, edit, remove)
- Track offerings and visitor information
- View meeting history and reports
- Access to cell-specific analytics

#### **Zone Leader**
- Oversee multiple cells within their zone
- Monitor attendance and performance metrics
- Generate zone-level reports
- Manage cell leaders and assignments
- View zone-wide statistics

#### **Super Admin**
- System-wide oversight and management
- Create and manage zones and cells
- User management and role assignments
- System-wide analytics and reporting
- Alert and notification management

### **Technical Features**
- **TypeScript** - Full type safety and better development experience
- **React Context** - Centralized state management
- **Tailwind CSS** - Modern, responsive styling
- **shadcn/ui** - Professional UI components
- **Local Storage** - Data persistence without backend
- **Protected Routes** - Role-based access control
- **Toast Notifications** - User feedback system

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI primitives

## 📁 Project Structure

```
gospel-gather/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AlertNotifications.tsx
│   │   ├── MemberManagement.tsx
│   │   ├── Navigation.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── ZoneCard.tsx
│   │   └── StatsCard.tsx
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── DataContext.tsx
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and types
│   │   └── types.ts         # TypeScript interfaces
│   ├── pages/               # Application pages
│   │   ├── Index.tsx        # Landing page
│   │   ├── Login.tsx        # Authentication
│   │   ├── CellDashboard.tsx
│   │   ├── ZoneLeaderDashboard.tsx
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── MeetingFormPage.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gospel-gather
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
npm run dev
```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### **Build for Production**
```bash
npm run build
```

### **Preview Production Build**
```bash
npm run preview
```

## 🔐 Demo Credentials

### **Cell Leader**
- Email: `leader@cell1.com`
- Password: `demo123`

### **Zone Leader**
- Email: `zone@church.com`
- Password: `zone123`

### **Super Admin**
- Email: `admin@church.com`
- Password: `admin123`

## 📊 Data Management

The application uses localStorage for data persistence, making it perfect for:
- **Demo purposes**
- **Small to medium churches**
- **Offline-first scenarios**
- **Quick deployment without backend setup**

### **Data Structure**
- **Users**: Authentication and role management
- **Zones**: Geographic or organizational divisions
- **Cells**: Individual home cell groups
- **Members**: Cell participants
- **Meetings**: Weekly gathering records
- **Visitors**: New attendees and converts
- **Alerts**: System notifications

## 🎨 Customization

### **Styling**
- Modify `src/index.css` for theme changes
- Update Tailwind config in `tailwind.config.ts`
- Customize shadcn/ui components in `src/components/ui/`

### **Data Models**
- Extend types in `src/lib/types.ts`
- Modify mock data in context files
- Add new fields to existing interfaces

### **Features**
- Add new dashboard tabs
- Implement additional report types
- Create new user roles
- Add export functionality

## 🔧 Development

### **Adding New Components**
1. Create component in `src/components/`
2. Add TypeScript interfaces to `src/lib/types.ts`
3. Import and use in relevant pages

### **Adding New Pages**
1. Create page component in `src/pages/`
2. Add route to `src/App.tsx`
3. Implement protected routing if needed

### **State Management**
- Use `useAuth()` for authentication state
- Use `useData()` for application data
- Create new contexts for additional features

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect your GitHub repository
2. Vercel will auto-detect Vite configuration
3. Deploy with zero configuration

### **Netlify**
1. Build the project: `npm run build`
2. Upload `dist/` folder to Netlify
3. Configure build settings if needed

### **Static Hosting**
1. Run `npm run build`
2. Upload `dist/` contents to your hosting provider
3. Configure routing for SPA (redirect to index.html)

## 🔮 Future Enhancements

### **Backend Integration**
- **Supabase** - Real-time database and authentication
- **Firebase** - Google's backend-as-a-service
- **Custom API** - Node.js/Express backend

### **Advanced Features**
- **Real-time notifications** - WebSocket integration
- **File uploads** - Profile pictures and documents
- **Advanced analytics** - Charts and reporting
- **Mobile app** - React Native version
- **Offline support** - Service worker implementation

### **Enterprise Features**
- **Multi-tenant support** - Multiple churches
- **Advanced permissions** - Granular access control
- **Audit logging** - Activity tracking
- **Backup/restore** - Data management tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Vite** - Fast build tool
- **React Team** - Amazing framework

## 📞 Support

For support, questions, or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for the church community**
