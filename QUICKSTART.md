# Quick Start Guide - LZ ClientFlow

## ⚡ Get Running in 30 Seconds

### Option 1: Direct Open (Easiest)
1. Open the project folder: `c:\Users\Lwandile\Desktop\lz-clientflow`
2. Double-click `index.html`
3. App opens in your default browser
4. **Note**: Demo data may not load with file:// protocol

### Option 2: Python Server (Recommended)
1. Open PowerShell in the project folder
2. Run: `python -m http.server 8000`
3. Visit: http://localhost:8000
4. Demo data loads correctly
5. **Tip**: Press `Ctrl+C` to stop server

### Option 3: VS Code Live Server
1. Install "Live Server" extension if not already installed
2. Right-click `index.html`
3. Select "Open with Live Server"
4. Browser opens automatically

---

## 🎬 First Steps After Loading

### 1. Load Demo Data
- Go to **Settings** (bottom left)
- Click **Load Demo Data**
- Dashboard populates with 5 sample clients and projects

### 2. Explore Dashboard
- See total clients, projects, payments
- View recent projects
- Check upcoming deadlines
- See current payment status

### 3. Test Client Management
- Go to **Clients**
- View demo clients
- Click any client to see details
- Try adding a new client
- Try editing/deleting

### 4. Test Project Management
- Go to **Projects**
- View project cards
- Filter by status
- Search for specific project
- Edit project status

### 5. Record a Payment
- Go to **Payments**
- Click "+ Record Payment"
- Select a project
- Enter amount
- See outstanding balance update automatically

---

## 📱 Testing Checklist

Quick tests to verify everything works:

- [ ] Navigate between all views (Dashboard, Clients, Projects, Payments, Calendar, Reports, Settings)
- [ ] Search for a client by name
- [ ] Filter projects by status
- [ ] Sort projects by due date
- [ ] Add a new client
- [ ] Add a new project
- [ ] Record a payment
- [ ] Delete a payment
- [ ] Toggle dark mode
- [ ] Export data as JSON
- [ ] Verify dark mode persists on reload
- [ ] Check mobile view (F12 → Toggle device toolbar)
- [ ] Test keyboard navigation (Tab key)

---

## 🔧 Key Features to Try

### Dashboard
- View business metrics
- See active projects
- Check upcoming deadlines
- Monitor payment collection

### Client Management
- Add/Edit/Delete clients
- View client project history
- Search by name, email, or phone
- Filter by preferred contact method

### Project Management
- Create projects linked to clients
- Track progress with visual bar
- Set project status
- View days until deadline
- See payment requirements vs received

### Payment Tracking
- Record deposits and payments
- Automatic balance calculation
- Payment method tracking
- Payment reference numbers

### Calendar View
- See all overdue projects
- Today's due projects
- This week's deadlines
- Upcoming 30-day view

### Reporting
- View key metrics
- Project status breakdown
- Revenue analytics
- Data export/import

### Settings
- Toggle dark mode
- Export data as JSON
- Export projects as CSV
- Import data from JSON
- Load demo data
- Reset all data

---

## 💾 Saving Your Work

**Good news**: Your data automatically saves to browser storage!

**Ways to backup**:
1. Go to **Settings**
2. Click **Export as JSON**
3. Save the file in safe location
4. Can import back anytime

---

## 🌙 Dark Mode

- Click the theme toggle in the sidebar
- Preference automatically saves
- Applies to all components
- Persists across sessions

---

## ⌨️ Keyboard Shortcuts

- `Tab` - Move between fields/buttons
- `Shift+Tab` - Move backwards
- `Enter` - Submit forms
- `Escape` - Close modals
- `Ctrl+S` - Would save (browser default)

---

## 📲 Mobile Testing

**In Chrome DevTools**:
1. Press `F12` to open developer tools
2. Click device toggle icon (top-left)
3. Select different device sizes
4. Test navigation, forms, tables

**Breakpoints**:
- Desktop: 1440px+
- Tablet: 1024px-1439px
- Mobile: 768px-1023px
- Small mobile: 430px-767px
- Extra small: 375px-429px

---

## 🐛 Troubleshooting

### App Not Loading
- **Problem**: White page, no content
- **Solution**: Try using Python server (Option 2) instead of direct file open

### Demo Data Won't Load
- **Problem**: Settings shows "Load Demo Data" but nothing happens
- **Solution**: Check browser console (F12) for errors

### Data Lost
- **Problem**: Closed browser and data gone
- **Solution**: This is expected. Data saved in browser session only. Use JSON export to backup.

### Theme Not Persisting
- **Problem**: Dark mode resets on page reload
- **Solution**: Check if cookies/storage are cleared. Try exporting and importing data.

### Forms Not Submitting
- **Problem**: Click button but nothing happens
- **Solution**: Check for validation errors (highlighted in red). Fill all required fields.

### Calculations Wrong
- **Problem**: Balance shows incorrect amount
- **Solution**: Refresh page. All calculations are automatic.

---

## 📊 Sample Workflows

### Workflow 1: New Client Project
1. Go to **Clients**
2. Add new client (fill all fields)
3. Go to **Projects**
4. Add project linked to new client
5. Set due date 30 days out
6. Go to **Payments**
7. Record deposit (50% of total price)
8. Watch balance update

### Workflow 2: Track Overdue Projects
1. Go to **Calendar**
2. See overdue projects at top
3. Click project to view details
4. Update status to "On Hold" if needed
5. Record payment when received

### Workflow 3: Export Data
1. Go to **Settings**
2. Click **Export as JSON**
3. Save file to computer
4. Open file to verify JSON format

---

## 🎓 Interview Preparation

Use this checklist to understand the app before interviews:

- [ ] Read INTERVIEW-GUIDE.md (in project root)
- [ ] Study state.js - understand data flow
- [ ] Review app.js - understand UI patterns
- [ ] Look at dashboard.js - business logic examples
- [ ] Check validation.js - data validation patterns
- [ ] Understand filters.js - complex filtering
- [ ] Know how to explain localStorage persistence
- [ ] Be ready to explain without frameworks

---

## ✅ Deployment Checklist

Before deploying to GitHub:

- [ ] App works locally with demo data
- [ ] All CRUD operations tested
- [ ] Filtering and search working
- [ ] Dark mode persists
- [ ] Export/Import working
- [ ] Mobile responsive tested
- [ ] No console errors
- [ ] README.md complete
- [ ] Code is clean and commented

---

## 🚀 Next Steps

1. **Test the app** - Use Quick Start above
2. **Review code** - Read through js/ modules
3. **Try all features** - Test everything on checklist
4. **Prepare for interview** - Read INTERVIEW-GUIDE.md
5. **Deploy to GitHub** - Follow steps in README.md

---

## 📞 Questions?

Refer to:
- **README.md** - Complete documentation
- **INTERVIEW-GUIDE.md** - Interview preparation
- **Code comments** - In js/ files explaining logic
- **Browser console** - (F12) for any errors

---

**Ready to test? Open index.html and get started! 🚀**
