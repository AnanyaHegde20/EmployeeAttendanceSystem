import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";
import { format, startOfMonth, endOfMonth } from "date-fns";
import bcrypt from "bcrypt";
import MemoryStore from "memorystore";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const MemoryStoreSession = MemoryStore(session);

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function requireManager(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden: Manager access required" });
  }
  next();
}

function calculateStatus(checkInTime: string): string {
  const [hours, minutes] = checkInTime.split(":").map(Number);
  const checkInMinutes = hours * 60 + minutes;

  if (checkInMinutes <= 9 * 60 + 30) {
    return "present";
  } else if (checkInMinutes <= 12 * 60) {
    return "late";
  } else {
    return "half-day";
  }
}

function calculateTotalHours(checkInTime: string, checkOutTime: string): string {
  const [inHours, inMinutes] = checkInTime.split(":").map(Number);
  const [outHours, outMinutes] = checkOutTime.split(":").map(Number);

  const inTotalMinutes = inHours * 60 + inMinutes;
  const outTotalMinutes = outHours * 60 + outMinutes;
  const diffMinutes = outTotalMinutes - inTotalMinutes;

  return (diffMinutes / 60).toFixed(2);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "attendance-system-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { name, email, password, role, department } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role,
        department,
        employeeId: "",
      });

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { email, password } = parsed.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      let isValidPassword = false;
      
      if (user.password.startsWith("$2b$")) {
        isValidPassword = await bcrypt.compare(password, user.password);
      } else {
        isValidPassword = user.password === password;
      }

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/attendance/checkin", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();
      const checkInTime = format(now, "HH:mm:ss");

      const existing = await storage.getAttendanceByUserAndDate(userId, today);
      if (existing) {
        if (existing.checkInTime) {
          return res.status(400).json({ message: "Already checked in today" });
        }
      }

      const status = calculateStatus(checkInTime);

      if (existing) {
        const updated = await storage.updateAttendance(existing.id, {
          checkInTime,
          status,
        });
        return res.json(updated);
      }

      const attendance = await storage.createAttendance({
        userId,
        date: today,
        checkInTime,
        checkOutTime: null,
        status,
        totalHours: null,
      });

      res.status(201).json(attendance);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Check-in failed" });
    }
  });

  app.post("/api/attendance/checkout", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();
      const checkOutTime = format(now, "HH:mm:ss");

      const existing = await storage.getAttendanceByUserAndDate(userId, today);
      if (!existing || !existing.checkInTime) {
        return res.status(400).json({ message: "You haven't checked in today" });
      }

      if (existing.checkOutTime) {
        return res.status(400).json({ message: "Already checked out today" });
      }

      const totalHours = calculateTotalHours(existing.checkInTime, checkOutTime);
      const hoursWorked = parseFloat(totalHours);
      
      let status = existing.status;
      if (hoursWorked < 4) {
        status = "half-day";
      }

      const updated = await storage.updateAttendance(existing.id, {
        checkOutTime,
        totalHours,
        status,
      });

      res.json(updated);
    } catch (error) {
      console.error("Check-out error:", error);
      res.status(500).json({ message: "Check-out failed" });
    }
  });

  app.get("/api/attendance/today", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const today = format(new Date(), "yyyy-MM-dd");

      const attendance = await storage.getAttendanceByUserAndDate(userId, today);
      res.json(attendance || null);
    } catch (error) {
      console.error("Get today attendance error:", error);
      res.status(500).json({ message: "Failed to get today's attendance" });
    }
  });

  app.get("/api/attendance/my-history", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const month = (req.query.month as string) || format(new Date(), "yyyy-MM");

      const monthStart = startOfMonth(new Date(month + "-01"));
      const monthEnd = endOfMonth(monthStart);
      const startDate = format(monthStart, "yyyy-MM-dd");
      const endDate = format(monthEnd, "yyyy-MM-dd");

      const history = await storage.getUserAttendanceHistory(userId, startDate, endDate);
      const summary = await storage.getUserMonthlySummary(userId, month);

      res.json({ history, summary });
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({ message: "Failed to get attendance history" });
    }
  });

  app.get("/api/attendance/my-summary", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const month = (req.query.month as string) || format(new Date(), "yyyy-MM");

      const summary = await storage.getUserMonthlySummary(userId, month);
      res.json(summary);
    } catch (error) {
      console.error("Get summary error:", error);
      res.status(500).json({ message: "Failed to get summary" });
    }
  });

  app.get("/api/dashboard/employee", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const stats = await storage.getEmployeeDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/employees", requireManager, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json({ employees });
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  app.get("/api/attendance/all", requireManager, async (req, res) => {
    try {
      const date = (req.query.date as string) || format(new Date(), "yyyy-MM-dd");
      const attendance = await storage.getAllAttendanceForDate(date);
      res.json({ attendance });
    } catch (error) {
      console.error("Get all attendance error:", error);
      res.status(500).json({ message: "Failed to get attendance" });
    }
  });

  app.get("/api/attendance/report", requireManager, async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const employee = req.query.employee as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const records = await storage.getAttendanceReport(startDate, endDate, employee);

      const summary = {
        totalRecords: records.length,
        presentCount: records.filter((r) => r.status === "present").length,
        absentCount: records.filter((r) => r.status === "absent").length,
        lateCount: records.filter((r) => r.status === "late").length,
        halfDayCount: records.filter((r) => r.status === "half-day").length,
        totalHours: records.reduce((sum, r) => sum + (parseFloat(r.totalHours || "0") || 0), 0),
      };

      res.json({ records, summary });
    } catch (error) {
      console.error("Get report error:", error);
      res.status(500).json({ message: "Failed to get report" });
    }
  });

  app.get("/api/attendance/calendar", requireManager, async (req, res) => {
    try {
      const month = (req.query.month as string) || format(new Date(), "yyyy-MM");
      const calendar = await storage.getCalendarData(month);
      res.json({ calendar });
    } catch (error) {
      console.error("Get calendar error:", error);
      res.status(500).json({ message: "Failed to get calendar data" });
    }
  });

  app.get("/api/attendance/export", requireManager, async (req, res) => {
    try {
      const date = (req.query.date as string) || format(new Date(), "yyyy-MM-dd");
      const attendance = await storage.getAllAttendanceForDate(date);

      const csvHeader = "Employee ID,Name,Department,Date,Check In,Check Out,Total Hours,Status\n";
      const csvRows = attendance.map((record) => {
        return `${record.user?.employeeId || ""},${record.user?.name || ""},${record.user?.department || ""},${record.date},${record.checkInTime || ""},${record.checkOutTime || ""},${record.totalHours || ""},${record.status}`;
      });

      const csv = csvHeader + csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=attendance-${date}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  app.get("/api/attendance/export-report", requireManager, async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const employee = req.query.employee as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const records = await storage.getAttendanceReport(startDate, endDate, employee);

      const csvHeader = "Employee ID,Name,Department,Date,Check In,Check Out,Total Hours,Status\n";
      const csvRows = records.map((record) => {
        return `${record.user?.employeeId || ""},${record.user?.name || ""},${record.user?.department || ""},${record.date},${record.checkInTime || ""},${record.checkOutTime || ""},${record.totalHours || ""},${record.status}`;
      });

      const csv = csvHeader + csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=attendance-report-${startDate}-to-${endDate}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("Export report error:", error);
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  app.get("/api/dashboard/manager", requireManager, async (req, res) => {
    try {
      const stats = await storage.getManagerDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Get manager dashboard error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  return httpServer;
}
