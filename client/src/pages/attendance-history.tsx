import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Attendance, AttendanceSummary } from "@shared/schema";

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

function getStatusColor(status: string): string {
  switch (status) {
    case "present":
      return "bg-chart-2";
    case "absent":
      return "bg-destructive";
    case "late":
      return "bg-chart-4";
    case "half-day":
      return "bg-chart-3";
    default:
      return "bg-muted";
  }
}

export default function AttendanceHistoryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data, isLoading } = useQuery<{ history: Attendance[]; summary: AttendanceSummary }>({
    queryKey: ["/api/attendance/my-history", format(monthStart, "yyyy-MM")],
  });

  const history = data?.history || [];
  const summary = data?.summary || { presentDays: 0, absentDays: 0, lateDays: 0, halfDays: 0, totalHours: 0 };

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getAttendanceForDay = (date: Date): Attendance | undefined => {
    return history.find((record) => isSameDay(new Date(record.date), date));
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Attendance History</h1>
        <p className="text-sm text-muted-foreground">
          View your monthly attendance records and summary
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-chart-2" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-present">{summary.presentDays}</p>
              <p className="text-xs text-muted-foreground">Present Days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-absent">{summary.absentDays}</p>
              <p className="text-xs text-muted-foreground">Absent Days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-chart-4" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-late">{summary.lateDays}</p>
              <p className="text-xs text-muted-foreground">Late Days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-hours">{summary.totalHours.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Click on a day to see details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const attendance = getAttendanceForDay(day);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => attendance && setSelectedRecord(attendance)}
                  disabled={!attendance}
                  className={`
                    aspect-square p-1 rounded-md flex flex-col items-center justify-center gap-1
                    transition-colors relative
                    ${attendance ? "hover-elevate cursor-pointer" : "cursor-default"}
                    ${isCurrentDay ? "ring-2 ring-primary" : ""}
                  `}
                  data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <span
                    className={`text-sm ${
                      isCurrentDay ? "font-bold text-primary" : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {attendance && (
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusColor(attendance.status)}`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <span className="text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Absent</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-chart-4" />
              <span className="text-muted-foreground">Late</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-chart-3" />
              <span className="text-muted-foreground">Half-Day</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRecord && format(new Date(selectedRecord.date), "EEEE, MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              Attendance details for this day
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground mb-1">Check In</span>
                  <span className="text-lg font-semibold">
                    {selectedRecord.checkInTime?.slice(0, 5) || "--:--"}
                  </span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground mb-1">Check Out</span>
                  <span className="text-lg font-semibold">
                    {selectedRecord.checkOutTime?.slice(0, 5) || "--:--"}
                  </span>
                </div>
              </div>
              {selectedRecord.totalHours && (
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">Total Hours</span>
                  <p className="text-2xl font-bold">{selectedRecord.totalHours}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
