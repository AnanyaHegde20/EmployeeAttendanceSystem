import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, date, time, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("employee"), // employee or manager
  employeeId: text("employee_id").notNull().unique(), // e.g., EMP001
  department: text("department").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  checkInTime: time("check_in_time"),
  checkOutTime: time("check_out_time"),
  status: text("status").notNull().default("absent"), // present, absent, late, half-day
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

// Registration schema with validation
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["employee", "manager"]),
  department: z.string().min(1, "Department is required"),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Extended types for API responses
export type UserWithoutPassword = Omit<User, "password">;

export type AttendanceWithUser = Attendance & {
  user?: UserWithoutPassword;
};

export type AttendanceSummary = {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  totalHours: number;
};

export type DashboardStats = {
  todayStatus: Attendance | null;
  monthlySummary: AttendanceSummary;
  recentAttendance: Attendance[];
};

export type ManagerDashboardStats = {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  absentEmployees: UserWithoutPassword[];
  weeklyTrend: { date: string; present: number; absent: number; late: number }[];
  departmentStats: { department: string; present: number; absent: number }[];
};
