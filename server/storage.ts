import {
  type User,
  type InsertUser,
  type Attendance,
  type InsertAttendance,
  type UserWithoutPassword,
  type AttendanceWithUser,
  type AttendanceSummary,
  type DashboardStats,
  type ManagerDashboardStats,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllEmployees(): Promise<UserWithoutPassword[]>;
  
  getAttendanceById(id: string): Promise<Attendance | undefined>;
  getAttendanceByUserAndDate(userId: string, date: string): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined>;
  
  getUserAttendanceHistory(userId: string, startDate: string, endDate: string): Promise<Attendance[]>;
  getUserMonthlySummary(userId: string, month: string): Promise<AttendanceSummary>;
  
  getAllAttendanceForDate(date: string): Promise<AttendanceWithUser[]>;
  getAttendanceReport(startDate: string, endDate: string, employeeId?: string): Promise<AttendanceWithUser[]>;
  getCalendarData(month: string): Promise<{
    date: string;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    records: AttendanceWithUser[];
  }[]>;
  
  getEmployeeDashboardStats(userId: string): Promise<DashboardStats>;
  getManagerDashboardStats(): Promise<ManagerDashboardStats>;
}

function removePassword(user: User): UserWithoutPassword {
  const { password, ...rest } = user;
  return rest;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private attendance: Map<string, Attendance>;
  private employeeCounter: number;

  constructor() {
    this.users = new Map();
    this.attendance = new Map();
    this.employeeCounter = 0;
    this.seedData();
  }

  private generateEmployeeId(): string {
    this.employeeCounter++;
    return `EMP${String(this.employeeCounter).padStart(3, "0")}`;
  }

  private seedData() {
    const plainPassword = "password123";

    const seedUsers = [
      { name: "John Smith", email: "john@company.com", role: "employee", department: "Engineering" },
      { name: "Jane Doe", email: "jane@company.com", role: "employee", department: "Product" },
      { name: "Bob Wilson", email: "bob@company.com", role: "employee", department: "Engineering" },
      { name: "Alice Brown", email: "alice@company.com", role: "employee", department: "Design" },
      { name: "Charlie Davis", email: "charlie@company.com", role: "employee", department: "Marketing" },
      { name: "Sarah Manager", email: "manager@company.com", role: "manager", department: "Management" },
    ];

    const userIds: string[] = [];
    seedUsers.forEach((userData) => {
      const id = randomUUID();
      userIds.push(id);
      const user: User = {
        id,
        name: userData.name,
        email: userData.email,
        password: plainPassword,
        role: userData.role,
        employeeId: this.generateEmployeeId(),
        department: userData.department,
        createdAt: new Date(),
      };
      this.users.set(id, user);
    });

    const employeeUserIds = userIds.slice(0, 5);
    const statuses = ["present", "late", "half-day", "absent"];

    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const date = subDays(new Date(), daysAgo);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      employeeUserIds.forEach((userId) => {
        const random = Math.random();
        let status: string;
        let checkInTime: string | null = null;
        let checkOutTime: string | null = null;
        let totalHours: string | null = null;

        if (random < 0.7) {
          status = "present";
          const hour = 8 + Math.floor(Math.random() * 2);
          const minute = Math.floor(Math.random() * 30);
          checkInTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
          const outHour = 17 + Math.floor(Math.random() * 2);
          const outMinute = Math.floor(Math.random() * 60);
          checkOutTime = `${String(outHour).padStart(2, "0")}:${String(outMinute).padStart(2, "0")}:00`;
          totalHours = String((outHour + outMinute / 60) - (hour + minute / 60)).slice(0, 4);
        } else if (random < 0.85) {
          status = "late";
          const hour = 10 + Math.floor(Math.random() * 2);
          const minute = Math.floor(Math.random() * 60);
          checkInTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
          checkOutTime = "18:00:00";
          totalHours = String(18 - (hour + minute / 60)).slice(0, 4);
        } else if (random < 0.95) {
          status = "half-day";
          checkInTime = "09:00:00";
          checkOutTime = "13:00:00";
          totalHours = "4.00";
        } else {
          status = "absent";
        }

        const attendanceId = randomUUID();
        const record: Attendance = {
          id: attendanceId,
          userId,
          date: dateStr,
          checkInTime,
          checkOutTime,
          status,
          totalHours,
          createdAt: new Date(),
        };
        this.attendance.set(attendanceId, record);
      });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      employeeId: this.generateEmployeeId(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllEmployees(): Promise<UserWithoutPassword[]> {
    return Array.from(this.users.values())
      .filter((user) => user.role === "employee")
      .map(removePassword);
  }

  async getAttendanceById(id: string): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByUserAndDate(userId: string, date: string): Promise<Attendance | undefined> {
    return Array.from(this.attendance.values()).find(
      (record) => record.userId === userId && record.date === date
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const record: Attendance = {
      ...insertAttendance,
      id,
      createdAt: new Date(),
    };
    this.attendance.set(id, record);
    return record;
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined> {
    const record = this.attendance.get(id);
    if (!record) return undefined;
    const updated = { ...record, ...updates };
    this.attendance.set(id, updated);
    return updated;
  }

  async getUserAttendanceHistory(userId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values())
      .filter((record) => {
        return (
          record.userId === userId &&
          record.date >= startDate &&
          record.date <= endDate
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getUserMonthlySummary(userId: string, month: string): Promise<AttendanceSummary> {
    const monthStart = startOfMonth(new Date(month + "-01"));
    const monthEnd = endOfMonth(monthStart);
    const startDate = format(monthStart, "yyyy-MM-dd");
    const endDate = format(monthEnd, "yyyy-MM-dd");

    const records = await this.getUserAttendanceHistory(userId, startDate, endDate);

    return {
      presentDays: records.filter((r) => r.status === "present").length,
      absentDays: records.filter((r) => r.status === "absent").length,
      lateDays: records.filter((r) => r.status === "late").length,
      halfDays: records.filter((r) => r.status === "half-day").length,
      totalHours: records.reduce((sum, r) => sum + (parseFloat(r.totalHours || "0") || 0), 0),
    };
  }

  async getAllAttendanceForDate(date: string): Promise<AttendanceWithUser[]> {
    const records = Array.from(this.attendance.values()).filter(
      (record) => record.date === date
    );

    return Promise.all(
      records.map(async (record) => {
        const user = await this.getUser(record.userId);
        return {
          ...record,
          user: user ? removePassword(user) : undefined,
        };
      })
    );
  }

  async getAttendanceReport(
    startDate: string,
    endDate: string,
    employeeId?: string
  ): Promise<AttendanceWithUser[]> {
    let records = Array.from(this.attendance.values()).filter(
      (record) => record.date >= startDate && record.date <= endDate
    );

    if (employeeId && employeeId !== "all") {
      records = records.filter((record) => record.userId === employeeId);
    }

    records.sort((a, b) => b.date.localeCompare(a.date));

    return Promise.all(
      records.map(async (record) => {
        const user = await this.getUser(record.userId);
        return {
          ...record,
          user: user ? removePassword(user) : undefined,
        };
      })
    );
  }

  async getCalendarData(month: string): Promise<{
    date: string;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    records: AttendanceWithUser[];
  }[]> {
    const monthStart = startOfMonth(new Date(month + "-01"));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const result = await Promise.all(
      days.map(async (day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const records = await this.getAllAttendanceForDate(dateStr);

        return {
          date: dateStr,
          present: records.filter((r) => r.status === "present").length,
          absent: records.filter((r) => r.status === "absent").length,
          late: records.filter((r) => r.status === "late").length,
          halfDay: records.filter((r) => r.status === "half-day").length,
          total: records.length,
          records,
        };
      })
    );

    return result;
  }

  async getEmployeeDashboardStats(userId: string): Promise<DashboardStats> {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayStatus = await this.getAttendanceByUserAndDate(userId, today);

    const currentMonth = format(new Date(), "yyyy-MM");
    const monthlySummary = await this.getUserMonthlySummary(userId, currentMonth);

    const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const recentAttendance = await this.getUserAttendanceHistory(userId, sevenDaysAgo, today);

    return {
      todayStatus: todayStatus || null,
      monthlySummary,
      recentAttendance,
    };
  }

  async getManagerDashboardStats(): Promise<ManagerDashboardStats> {
    const today = format(new Date(), "yyyy-MM-dd");
    const employees = await this.getAllEmployees();
    const todayAttendance = await this.getAllAttendanceForDate(today);

    const presentToday = todayAttendance.filter((r) => r.status === "present" || r.status === "late" || r.status === "half-day").length;
    const absentToday = employees.length - todayAttendance.length + todayAttendance.filter((r) => r.status === "absent").length;
    const lateToday = todayAttendance.filter((r) => r.status === "late").length;

    const checkedInUserIds = new Set(todayAttendance.map((r) => r.userId));
    const absentEmployees = employees.filter((emp) => !checkedInUserIds.has(emp.id));

    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const records = await this.getAllAttendanceForDate(dateStr);

      weeklyTrend.push({
        date: dateStr,
        present: records.filter((r) => r.status === "present").length,
        absent: records.filter((r) => r.status === "absent").length + (employees.length - records.length),
        late: records.filter((r) => r.status === "late").length,
      });
    }

    const departmentMap = new Map<string, { present: number; absent: number }>();
    employees.forEach((emp) => {
      if (!departmentMap.has(emp.department)) {
        departmentMap.set(emp.department, { present: 0, absent: 0 });
      }
    });

    todayAttendance.forEach((record) => {
      if (record.user?.department) {
        const dept = departmentMap.get(record.user.department);
        if (dept) {
          if (record.status !== "absent") {
            dept.present++;
          } else {
            dept.absent++;
          }
        }
      }
    });

    employees.forEach((emp) => {
      if (!checkedInUserIds.has(emp.id)) {
        const dept = departmentMap.get(emp.department);
        if (dept) {
          dept.absent++;
        }
      }
    });

    const departmentStats = Array.from(departmentMap.entries()).map(([department, stats]) => ({
      department,
      ...stats,
    }));

    return {
      totalEmployees: employees.length,
      presentToday,
      absentToday,
      lateToday,
      absentEmployees,
      weeklyTrend,
      departmentStats,
    };
  }
}

export const storage = new MemStorage();
