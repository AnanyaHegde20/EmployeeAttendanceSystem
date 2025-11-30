import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { FileText, Download, Calendar, Users, Loader2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { AttendanceWithUser, UserWithoutPassword } from "@shared/schema";

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

export default function ManagerReportsPage() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: employeesData } = useQuery<{ employees: UserWithoutPassword[] }>({
    queryKey: ["/api/employees"],
  });

  const { data: reportData, isLoading } = useQuery<{
    records: AttendanceWithUser[];
    summary: {
      totalRecords: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      halfDayCount: number;
      totalHours: number;
    };
  }>({
    queryKey: ["/api/attendance/report", startDate, endDate, selectedEmployee],
  });

  const employees = employeesData?.employees || [];
  const records = reportData?.records || [];
  const summary = reportData?.summary || {
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    totalHours: 0,
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        employee: selectedEmployee,
      });

      const response = await fetch(`/api/attendance/export-report?${params}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report exported",
        description: "Your attendance report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export the report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Attendance Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and export attendance reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Select date range and employee to generate report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                data-testid="button-export-report"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-total-records">
                {summary.totalRecords}
              </p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-chart-2" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-present-count">
                {summary.presentCount}
              </p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-absent-count">
                {summary.absentCount}
              </p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-chart-4" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-late-count">
                {summary.lateCount}
              </p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold" data-testid="stat-total-hours">
                {summary.totalHours.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Report Preview
          </CardTitle>
          <CardDescription>
            Showing {records.length} records from {format(new Date(startDate), "MMM d")} to{" "}
            {format(new Date(endDate), "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Employee</th>
                    <th className="text-left py-3 px-2 font-medium">Department</th>
                    <th className="text-left py-3 px-2 font-medium">Check In</th>
                    <th className="text-left py-3 px-2 font-medium">Check Out</th>
                    <th className="text-left py-3 px-2 font-medium">Hours</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 20).map((record) => {
                    const initials = record.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "??";

                    return (
                      <tr
                        key={record.id}
                        className="border-b last:border-0"
                        data-testid={`row-report-${record.id}`}
                      >
                        <td className="py-3 px-2 text-sm">
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{record.user?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          {record.user?.department || "-"}
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
                    );
                  })}
                </tbody>
              </table>
              {records.length > 20 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Showing first 20 of {records.length} records. Export to see all.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No records found for the selected criteria</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting the date range or employee selection
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
