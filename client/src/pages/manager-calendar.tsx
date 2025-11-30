import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isToday,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AttendanceWithUser } from "@shared/schema";

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

type DayAttendance = {
  date: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
  records: AttendanceWithUser[];
};

export default function ManagerCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayAttendance | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data, isLoading } = useQuery<{ calendar: DayAttendance[] }>({
    queryKey: ["/api/attendance/calendar", format(monthStart, "yyyy-MM")],
  });

  const calendarData = data?.calendar || [];
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDayData = (date: Date): DayAttendance | undefined => {
    return calendarData.find((d) => isSameDay(new Date(d.date), date));
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Team Calendar</h1>
        <p className="text-sm text-muted-foreground">
          View team attendance overview by day
        </p>
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
            Click on a day to see attendance details
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
              const dayData = getDayData(day);
              const isCurrentDay = isToday(day);
              const hasData = dayData && dayData.total > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => hasData && setSelectedDay(dayData)}
                  disabled={!hasData}
                  className={`
                    aspect-square p-1 rounded-md flex flex-col items-center justify-center
                    transition-colors relative
                    ${hasData ? "hover-elevate cursor-pointer" : "cursor-default"}
                    ${isCurrentDay ? "ring-2 ring-primary" : ""}
                  `}
                  data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <span
                    className={`text-sm mb-1 ${
                      isCurrentDay ? "font-bold text-primary" : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasData && (
                    <div className="flex gap-0.5">
                      {dayData.present > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-chart-2" />
                      )}
                      {dayData.absent > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      )}
                      {dayData.late > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-chart-4" />
                      )}
                    </div>
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

      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(new Date(selectedDay.date), "EEEE, MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              Team attendance details for this day
            </DialogDescription>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-3 bg-chart-2/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-chart-2" />
                  <div>
                    <p className="text-lg font-bold">{selectedDay.present}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-lg font-bold">{selectedDay.absent}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-chart-4/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-chart-4" />
                  <div>
                    <p className="text-lg font-bold">{selectedDay.late}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-chart-3/10 rounded-lg">
                  <Users className="w-5 h-5 text-chart-3" />
                  <div>
                    <p className="text-lg font-bold">{selectedDay.halfDay}</p>
                    <p className="text-xs text-muted-foreground">Half-Day</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Employee Details</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {selectedDay.records.map((record) => {
                    const initials = record.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "??";

                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {record.user?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.checkInTime?.slice(0, 5) || "--:--"} -{" "}
                              {record.checkOutTime?.slice(0, 5) || "--:--"}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={record.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
