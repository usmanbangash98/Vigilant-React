import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildBackendUrl, cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  Database,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  UserPlus,
} from "lucide-react";

type NavigationItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
};

export default function DashboardPage() {
  useEffect(() => {
    document.title = "Dashboard — VigilantEye";
  }, []);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const logoutEndpoint = useMemo(() => buildBackendUrl("/api/logout"), []);

  const navigationItems = useMemo<NavigationItem[]>(
    () => [
      {
        id: "overview",
        label: "Overview",
        description: "High level metrics",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        id: "live-monitoring",
        label: "Live Monitoring",
        description: "View camera feeds",
        icon: Camera,
        path: "/dashboard/live-monitoring",
      },
      {
        id: "reports",
        label: "Reports",
        description: "Performance & insights",
        icon: History,
        path: "/dashboard/reports",
      },
      {
        id: "database",
        label: "Database",
        description: "Manage intelligence records",
        icon: Database,
        path: "/dashboard/database",
      },
      {
        id: "add-citizen",
        label: "Add Thief",
        description: "Register new person",
        icon: UserPlus,
        path: "/dashboard/add-citizen",
      },
      {
        id: "settings",
        label: "Settings",
        description: "Customize settings",
        icon: Settings,
        path: "/dashboard/settings",
      },
    ],
    [],
  );

  const { logout } = useAuth();

  async function handleLogout() {
    if (loggingOut) return;
    setLogoutError(null);
    setLoggingOut(true);

    try {
      const resp = await fetch(logoutEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        credentials: "include",
      });

      const contentType = resp.headers.get("Content-Type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await resp.json().catch(() => null) : null;

      if (resp.ok && data?.success !== false) {
        // Clear auth token and state
        logout();

        // Clear non-httpOnly cookies if any remain
        document.cookie =
          "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        document.cookie =
          "csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

        // Use React Router navigation instead of window.location
        navigate("/login");
        return;
      }

      const message =
        data?.error || data?.detail || "Unable to log out. Please try again.";
      setLogoutError(message);
    } catch (error) {
      setLogoutError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30 text-foreground">
      <aside className="hidden w-72 flex-col border-r border-border/60 bg-background/85 backdrop-blur-lg lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              VigilantEye
            </p>
            <p className="text-lg font-semibold">Security Suite</p>
          </div>
        </div>

        <nav className="flex-1 space-y-8 px-4">
          <div>
            <div className="mt-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path
                  ? item.path === "/dashboard"
                    ? location.pathname === "/dashboard"
                    : location.pathname.startsWith(item.path)
                  : false;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
                      isActive && "bg-primary/10 text-primary",
                    )}>
                    <Icon className="h-4 w-4" />
                    <div className="flex flex-1 flex-col items-start text-left">
                      <span>{item.label}</span>
                      <span className="text-xs font-normal text-muted-foreground/80 group-hover:text-primary/80">
                        {item.description}
                      </span>
                    </div>
                    {item.badge ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="space-y-4 border-t border-border/60 px-2 py-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive disabled:pointer-events-none disabled:opacity-60">
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </aside>

      <div className="flex w-full flex-col">
        <main className="flex-1 space-y-8 px-6 py-6 lg:px-10 lg:py-10">
          {logoutError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {logoutError}
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
