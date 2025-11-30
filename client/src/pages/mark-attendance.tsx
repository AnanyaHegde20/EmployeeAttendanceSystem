import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle,
  LogIn,
  LogOut,
  Timer,
  Calendar,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Attendance } from "@shared/schema";

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

export default function MarkAttendancePage() {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();

  const { data: todayAttendance, isLoading } = useQuery<Attendance | null>({
    queryKey: ["/api/attendance/today"],
  });

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await apiRequest("POST", "/api/attendance/checkin");
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/employee"] });
      toast({
        title: "Checked in successfully!",
        description: `You checked in at ${format(new Date(), "h:mm a")}`,
      });
    } catch (error) {
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckingOut(true);
    try {
      await apiRequest("POST", "/api/attendance/checkout");
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/employee"] });
      toast({
        title: "Checked out successfully!",
        description: `You checked out at ${format(new Date(), "h:mm a")}`,
      });
    } catch (error) {
      toast({
        title: "Check-out failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isCheckedIn = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime;
  const isCompleted = todayAttendance?.checkInTime && todayAttendance?.checkOutTime;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Mark Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <Card>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className={`flex items-center justify-center w-20 h-20 rounded-full ${
              isCompleted ? "bg-chart-2/10" : isCheckedIn ? "bg-primary/10" : "bg-muted"
            }`}>
              {isCompleted ? (
                <CheckCircle className="w-10 h-10 text-chart-2" />
              ) : isCheckedIn ? (
                <Timer className="w-10 h-10 text-primary" />
              ) : (
                <Clock className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
          </div>
          <CardTitle className="text-xl">
            {isCompleted
              ? "Attendance Complete"
              : isCheckedIn
              ? "Currently Working"
              : "Not Checked In"}
          </CardTitle>
          <CardDescription>
            {isCompleted
              ? "You've completed your attendance for today"
              : isCheckedIn
              ? "Don't forget to check out when you leave"
              : "Check in to start your workday"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {todayAttendance && (
            <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
              <StatusBadge status={todayAttendance.status} />
              {todayAttendance.totalHours && (
                <span className="text-sm text-muted-foreground">
                  Total: {todayAttendance.totalHours} hours
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <LogIn className="w-6 h-6 text-chart-2 mb-2" />
              <span className="text-xs text-muted-foreground mb-1">Check In</span>
              <span className="text-lg font-semibold" data-testid="text-checkin-time">
                {todayAttendance?.checkInTime?.slice(0, 5) || "--:--"}
              </span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <LogOut className="w-6 h-6 text-destructive mb-2" />
              <span className="text-xs text-muted-foreground mb-1">Check Out</span>
              <span className="text-lg font-semibold" data-testid="text-checkout-time">
                {todayAttendance?.checkOutTime?.slice(0, 5) || "--:--"}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            {!todayAttendance?.checkInTime ? (
              <Button
                size="lg"
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="w-full max-w-xs"
                data-testid="button-checkin"
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Check In Now
                  </>
                )}
              </Button>
            ) : !todayAttendance?.checkOutTime ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={handleCheckOut}
                disabled={isCheckingOut}
                className="w-full max-w-xs"
                data-testid="button-checkout"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Check Out Now
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                disabled
                className="w-full max-w-xs"
                data-testid="button-completed"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed for Today
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-2 mt-1.5 shrink-0" />
              <span><strong className="text-foreground">Present:</strong> Check in before 9:30 AM</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-4 mt-1.5 shrink-0" />
              <span><strong className="text-foreground">Late:</strong> Check in between 9:30 AM and 12:00 PM</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-3 mt-1.5 shrink-0" />
              <span><strong className="text-foreground">Half-Day:</strong> Working less than 4 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
              <span><strong className="text-foreground">Absent:</strong> No check-in recorded</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
