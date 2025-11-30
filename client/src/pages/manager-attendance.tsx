import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, Search, Filter, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ManagerAttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: attendanceData, isLoading } = useQuery<{ attendance: AttendanceWithUser[] }>({
    queryKey: ["/api/attendance/all", dateFilter, statusFilter],
  });

  const attendance = attendanceData?.attendance || [];

  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch =
      record.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.user?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.user?.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/attendance/export?date=${dateFilter}&status=${statusFilter}`,
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${dateFilter}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Attendance report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export attendance data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">All Attendance</h1>
          <p className="text-sm text-muted-foreground">
            View and manage employee attendance records
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="secondary"
          data-testid="button-export"
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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-auto"
                data-testid="input-date-filter"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Attendance Records
          </CardTitle>
          <CardDescription>
            {format(new Date(dateFilter), "EEEE, MMMM d, yyyy")} - {filteredAttendance.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Employee</th>
                    <th className="text-left py-3 px-2 font-medium">Department</th>
                    <th className="text-left py-3 px-2 font-medium">Check In</th>
                    <th className="text-left py-3 px-2 font-medium">Check Out</th>
                    <th className="text-left py-3 px-2 font-medium">Hours</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record) => {
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
                        data-testid={`row-attendance-${record.id}`}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {record.user?.name || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {record.user?.employeeId}
                              </span>
                            </div>
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
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No attendance records found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
