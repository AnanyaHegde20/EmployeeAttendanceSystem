import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import EmployeeDashboard from "@/pages/employee-dashboard";
import MarkAttendancePage from "@/pages/mark-attendance";
import AttendanceHistoryPage from "@/pages/attendance-history";
import ProfilePage from "@/pages/profile";
import ManagerDashboard from "@/pages/manager-dashboard";
import ManagerAttendancePage from "@/pages/manager-attendance";
import ManagerReportsPage from "@/pages/manager-reports";
import ManagerCalendarPage from "@/pages/manager-calendar";

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: () => JSX.Element | null;
  allowedRoles?: ("employee" | "manager")[];
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as "employee" | "manager")) {
    const redirectPath = user.role === "manager" ? "/manager/dashboard" : "/dashboard";
    return <Redirect to={redirectPath} />;
  }

  return <Component />;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <>{children}</>;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function PublicRoute({ component: Component }: { component: () => JSX.Element | null }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (user) {
    const redirectPath = user.role === "manager" ? "/manager/dashboard" : "/dashboard";
    return <Redirect to={redirectPath} />;
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {user ? (
          <Redirect to={user.role === "manager" ? "/manager/dashboard" : "/dashboard"} />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/login">
        <PublicRoute component={LoginPage} />
      </Route>
      <Route path="/register">
        <PublicRoute component={RegisterPage} />
      </Route>

      <Route path="/dashboard">
        <AuthenticatedLayout>
          <ProtectedRoute component={EmployeeDashboard} allowedRoles={["employee"]} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/attendance">
        <AuthenticatedLayout>
          <ProtectedRoute component={MarkAttendancePage} allowedRoles={["employee"]} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/history">
        <AuthenticatedLayout>
          <ProtectedRoute component={AttendanceHistoryPage} allowedRoles={["employee"]} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/profile">
        <AuthenticatedLayout>
          <ProtectedRoute component={ProfilePage} />
        </AuthenticatedLayout>
      </Route>

      <Route path="/manager/dashboard">
        <AuthenticatedLayout>
          <ProtectedRoute component={ManagerDashboard} allowedRoles={["manager"]} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/manager/attendance">
        <AuthenticatedLayout>
          <ProtectedRoute component={ManagerAttendancePage} allowedRoles={["manager"]} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/manager/calendar">
        <AuthenticatedLayout>
          <ProtectedRoute component={ManagerCalendarPage} allowedRoles={["manager"]} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/manager/reports">
        <AuthenticatedLayout>
          <ProtectedRoute component={ManagerReportsPage} allowedRoles={["manager"]} />
        </AuthenticatedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
