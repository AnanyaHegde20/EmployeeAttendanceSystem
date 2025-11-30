import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import type { ManagerDashboardStats, UserWithoutPassword } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  colorClass,
}: {
  title: string;
  value: string | number;
  icon: typeof Users;
  description?: string;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{title}</span>
            <span className="text-3xl font-bold text-foreground" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              {value}
            </span>
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<ManagerDashboardStats>({
    queryKey: ["/api/dashboard/manager"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const {
    totalEmployees = 0,
    presentToday = 0,
    absentToday = 0,
    lateToday = 0,
    absentEmployees = [],
    weeklyTrend = [],
    departmentStats = [],
  } = stats || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Manager Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          colorClass="bg-primary/10 text-primary"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          icon={CheckCircle}
          colorClass="bg-chart-2/10 text-chart-2"
        />
        <StatCard
          title="Absent Today"
          value={absentToday}
          icon={XCircle}
          colorClass="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Late Today"
          value={lateToday}
          icon={AlertCircle}
          colorClass="bg-chart-4/10 text-chart-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Attendance Trend
            </CardTitle>
            <CardDescription>
              Attendance overview for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "EEE")}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(value) => format(new Date(value), "EEEE, MMM d")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-4))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--destructive))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Department Breakdown
            </CardTitle>
            <CardDescription>
              Attendance by department today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    dataKey="department"
                    type="category"
                    width={100}
                    className="text-xs"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="present"
                    fill="hsl(var(--chart-2))"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    fill="hsl(var(--destructive))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Absent Today
          </CardTitle>
          <CardDescription>
            Employees who haven't checked in today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {absentEmployees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {absentEmployees.map((employee: UserWithoutPassword) => {
                const initials = employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    data-testid={`absent-employee-${employee.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-destructive/10 text-destructive text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {employee.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {employee.department}
                      </span>
                    </div>
                    <Badge variant="destructive" className="ml-auto shrink-0">
                      Absent
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-chart-2 mb-3" />
              <p className="text-muted-foreground">All employees are present today!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
