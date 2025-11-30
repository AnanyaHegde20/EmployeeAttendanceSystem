import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DashboardStats, Attendance } from "@shared/schema";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  colorClass,
}: {
  title: string;
  value: string | number;
  icon: typeof Clock;
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    present: { variant: "default", className: "bg-chart-2 hover:bg-chart-2/90" },
    absent: { variant: "destructive", className: "" },
    late: { variant: "secondary", className: "bg-chart-4 text-white hover:bg-chart-4/90" },
    "half-day": { variant: "secondary", className: "bg-chart-3 text-white hover:bg-chart-3/90" },
  };

  const { variant, className } = config[status] || { variant: "secondary", className: "" };

  return (
    <Badge variant={variant} className={`capitalize ${className}`}>
      {status}
    </Badge>
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/employee"],
  });

  const handleCheckIn = async () => {
    try {
      await apiRequest("POST", "/api/attendance/checkin");
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/employee"] });
      toast({
        title: "Checked in!",
        description: `You checked in at ${format(new Date(), "h:mm a")}`,
      });
    } catch (error) {
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiRequest("POST", "/api/attendance/checkout");
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/employee"] });
      toast({
        title: "Checked out!",
        description: `You checked out at ${format(new Date(), "h:mm a")}`,
      });
    } catch (error) {
      toast({
        title: "Check-out failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const todayStatus = stats?.todayStatus;
  const summary = stats?.monthlySummary || { presentDays: 0, absentDays: 0, lateDays: 0, halfDays: 0, totalHours: 0 };
  const recentAttendance = stats?.recentAttendance || [];

  const isCheckedIn = todayStatus?.checkInTime && !todayStatus?.checkOutTime;
  const isCompleted = todayStatus?.checkInTime && todayStatus?.checkOutTime;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Present Days"
          value={summary.presentDays}
          icon={CheckCircle}
          description="This month"
          colorClass="bg-chart-2/10 text-chart-2"
        />
        <StatCard
          title="Absent Days"
          value={summary.absentDays}
          icon={XCircle}
          description="This month"
          colorClass="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Late Days"
          value={summary.lateDays}
          icon={AlertCircle}
          description="This month"
          colorClass="bg-chart-4/10 text-chart-4"
        />
        <StatCard
          title="Hours Worked"
          value={summary.totalHours.toFixed(1)}
          icon={Timer}
          description="This month"
          colorClass="bg-primary/10 text-primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Status
          </CardTitle>
          <CardDescription>
            Mark your attendance for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              {todayStatus ? (
                <>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={todayStatus.status} />
                    {todayStatus.totalHours && (
                      <span className="text-sm text-muted-foreground">
                        {todayStatus.totalHours} hours
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {todayStatus.checkInTime && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-chart-2" />
                        In: {todayStatus.checkInTime.slice(0, 5)}
                      </span>
                    )}
                    {todayStatus.checkOutTime && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 rotate-180 text-destructive" />
                        Out: {todayStatus.checkOutTime.slice(0, 5)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">You haven't checked in yet today</p>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {!todayStatus?.checkInTime ? (
                <Button
                  onClick={handleCheckIn}
                  className="w-full sm:w-auto"
                  data-testid="button-checkin"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              ) : !todayStatus?.checkOutTime ? (
                <Button
                  onClick={handleCheckOut}
                  variant="secondary"
                  className="w-full sm:w-auto"
                  data-testid="button-checkout"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              ) : (
                <Button disabled className="w-full sm:w-auto" data-testid="button-completed">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Attendance
          </CardTitle>
          <CardDescription>
            Your attendance for the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Check In</th>
                    <th className="text-left py-3 px-2 font-medium">Check Out</th>
                    <th className="text-left py-3 px-2 font-medium">Hours</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map((record: Attendance) => (
                    <tr
                      key={record.id}
                      className="border-b last:border-0"
                      data-testid={`row-attendance-${record.id}`}
                    >
                      <td className="py-3 px-2 text-sm">
                        {format(new Date(record.date), "EEE, MMM d")}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {record.checkInTime?.slice(0, 5) || "-"}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {record.checkOutTime?.slice(0, 5) || "-"}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {record.totalHours || "-"}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No attendance records yet</p>
              <p className="text-sm text-muted-foreground">Check in to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
