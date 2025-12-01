
<div align="center">

# ⏰✨ **Employee Attendance System – AttendEase**

A modern, stylish, full‑stack attendance management system with  
**Employee + Manager roles**, clean UI, API integration, and PostgreSQL support.

---

</div>

## 🚀 **Features Overview**

### 👨‍💼 Employee Features
- ✔ Login / Register  
- ✔ Dashboard  
- ✔ Check‑In / Check‑Out  
- ✔ Attendance History (Calendar + Table)  
- ✔ Monthly Summary  
- ✔ Profile Page  

### 👩‍💻 Manager Features
- ✔ Manager Login  
- ✔ Dashboard Overview  
- ✔ Employee Attendance Overview  
- ✔ Reports + CSV Export  

### 🗄 Backend (Node.js + Express + PostgreSQL)
- 🔐 JWT Authentication  
- 📊 Analytics  
- 📅 Pagination + Filtering  
- 📁 CSV Export  

---

## 📦 **Setup Instructions**

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/AnanyaHegde20.git
cd AttendanceTracker
```

### 2️⃣ Install Backend Dependencies
```bash
cd backend
npm install
```

### 3️⃣ Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## ⚙️ **Environment Variables (.env)**

```
PORT=5000
NODE_ENV=development

POSTGRES_URI=postgres://username:password@localhost:5432/attendance_db

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:3000
```

---

## ▶️ **How to Run the Project**

### 🚀 Start Backend
```bash
cd backend
npm run dev
```
📌 Runs at: **http://localhost:5000**

### 🎨 Start Frontend
```bash
cd frontend
npm start
```
📌 Runs at: **http://localhost:3000**

---

## 🖼 **Screenshots**

```

### 🔐 Login Page
![Login Page](images/Login%20page.png)


### 🧑‍💼 Manager Dashboard
![Manager Dashboard](images/ManagerDashboard.png)

### 👨‍💻 Employee Dashboard
![Employee Dashboard](images/EmployeeDashboard.png)


```

Suggested screenshots:
- Login Page  
- Employee Dashboard  
- Mark Attendance  
- Manager Dashboard  
- Reports Page  

---

## 🌱 **Seed Data**

📂 Seed file path:
```
/backend/src/seed/seed.js
```

▶️ Run seed script:
```
node src/seed/seed.js
```

---

<div align="center">

## 💡 *Fully Functional • Stylish • Developer‑Friendly*

</div>
