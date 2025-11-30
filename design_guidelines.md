# Employee Attendance System - Design Guidelines

## Design Approach

**Selected System:** Material Design 3 principles adapted for enterprise productivity
**Rationale:** Information-dense application requiring clear data hierarchy, efficient workflows, and role-based interface differentiation. Focus on usability, scanability, and quick task completion.

## Typography

**Font Family:** Inter or Roboto from Google Fonts
- **Headings:** 
  - Page titles: text-2xl font-semibold
  - Section headers: text-lg font-medium
  - Card titles: text-base font-medium
- **Body:** text-sm for primary content, text-xs for metadata/timestamps
- **Stats/Numbers:** text-3xl font-bold for dashboard metrics

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, gap-4, m-6, py-8)
- Consistent card padding: p-6
- Section spacing: space-y-6
- Grid gaps: gap-4 for cards, gap-2 for list items
- Page containers: max-w-7xl mx-auto px-4

**Grid System:**
- Dashboard cards: 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Stat cards: 4-column for metrics (grid-cols-2 lg:grid-cols-4)
- Tables: Full-width responsive with horizontal scroll on mobile

## Component Library

### Navigation
**Role-Based Sidebar:**
- Fixed left sidebar (w-64) with logo at top
- Navigation items with icons (Heroicons) and labels
- Active state: slightly elevated background, medium font weight
- Role indicator badge at bottom showing "Employee" or "Manager"
- Collapsed mobile nav with hamburger menu

### Dashboard Cards
**Stat Cards:**
- Elevated surface with subtle shadow
- Large number display (text-3xl font-bold)
- Small label below (text-xs text-muted)
- Optional trend indicator (up/down arrow with percentage)
- Minimum height for visual consistency

**Info Cards:**
- Contain lists, recent activity, or quick actions
- Header with title and optional action button
- Divided sections with subtle borders
- Compact list items with text-sm

### Attendance Components
**Check-In/Out Button:**
- Large, prominent button in employee dashboard
- Display current status prominently
- Show timestamp when checked in
- Disabled state when already completed

**Calendar View:**
- Monthly grid layout with day cells
- Status indicators: Small filled circles or background treatment
- Present (success tone), Absent (error tone), Late (warning tone), Half-day (neutral tone)
- Click interaction to show day details
- Month navigation arrows
- Legend showing status meanings

**Attendance Table:**
- Striped rows for readability
- Columns: Date, Check-in, Check-out, Status, Total Hours
- Status badges with appropriate visual treatment
- Sortable headers
- Pagination for long lists (10-20 items per page)

### Manager-Specific Components
**Team Overview Cards:**
- Employee count, present/absent split
- "Who's Out Today" list with avatars
- Late arrivals with timestamps

**Filter Bar:**
- Horizontal layout with dropdowns and date pickers
- Employee selector, date range, status filter
- Clear filters action
- Apply/Search button

**Export Section:**
- Date range selector
- Employee multi-select or "All" option
- Export to CSV button with download icon
- Format preview or record count

### Forms
**Login/Register:**
- Centered card on clean background
- Input fields with labels above
- Clear error states below inputs
- Role selector for registration (radio buttons or dropdown)
- Submit button spans full width
- Link to alternate form (Login ↔ Register)

**Profile Form:**
- Two-column layout on desktop
- Avatar placeholder or upload
- Read-only fields for employee ID, role
- Editable fields for name, department
- Save changes button

### Data Visualization
**Charts (Manager Dashboard):**
- Weekly attendance trend: Line or bar chart
- Department comparison: Horizontal bar chart or grouped bars
- Use chart library (Chart.js or Recharts)
- Contained in cards with titles
- Responsive sizing

### Interactive Elements
**Status Badges:**
- Rounded pills with subtle background
- Text in medium weight
- Size proportional to context (larger in headers, smaller in tables)

**Action Buttons:**
- Primary actions: Solid background, medium weight text
- Secondary actions: Outlined or ghost style
- Icon + text for clarity
- Consistent sizing (px-4 py-2 for standard)

## Page Layouts

### Employee Dashboard
- Grid of 4 stat cards at top (Present Days, Absent Days, Late Days, Hours This Month)
- Large check-in/out status card with action button
- Recent attendance table (last 7 days)
- Calendar widget showing current month

### Manager Dashboard
- Grid of team stat cards (Total Employees, Present Today, Absent Today, Late Today)
- Charts section (2-column: Weekly trend + Department breakdown)
- "Absent Today" list card
- Quick filters for date navigation

### Attendance History (Employee)
- Month selector at top
- Calendar grid as primary view
- Summary stats above calendar (Total: X Present, Y Absent, Z Late)
- Details panel or modal when clicking date

### All Attendance (Manager)
- Filter bar with employee/date/status selectors
- Data table with all columns
- Pagination controls
- Export button positioned top-right

### Reports Page (Manager)
- Filter section at top (date range, employee selector)
- Results count display
- Export options (CSV format)
- Preview table of selected data

## Accessibility
- Consistent focus states with visible outline
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons
- Screen reader announcements for status changes
- Sufficient contrast for all text and status indicators

## Images
**No Hero Images Required** - This is a utility application focused on functionality over marketing appeal.

**User Avatars:**
- Circular placeholders (32px for lists, 64px for profiles)
- Use initials when no photo uploaded
- Position in sidebar profile section and team lists

**Empty States:**
- Illustrative icons (not photos) for empty tables/calendars
- Friendly message encouraging first action (e.g., "No attendance records yet. Check in to get started!")