import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, Clock, ShieldAlert } from "lucide-react";

const ALERTS = [
  {
    id: "alert-3021",
    title: "Suspicious activity detected",
    location: "Loading Dock",
    severity: "Critical",
    timestamp: "Just now",
    description: "Multiple motion triggers detected after closing hours.",
  },
  {
    id: "alert-2988",
    title: "Badge access denied",
    location: "Server Room",
    severity: "High",
    timestamp: "12 minutes ago",
    description: "Unauthorized credential attempted repeated access.",
  },
  {
    id: "alert-2965",
    title: "Camera signal lost",
    location: "West Corridor",
    severity: "Medium",
    timestamp: "35 minutes ago",
    description: "Feed interrupted, awaiting automatic reconnection.",
  },
];

function severityVariant(severity: string): "default" | "destructive" | "secondary" {
  switch (severity) {
    case "Critical":
      return "destructive";
    case "High":
      return "default";
    default:
      return "secondary";
  }
}

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Incident response queue</h2>
          <p className="text-sm text-muted-foreground">
            Prioritize alerts, acknowledge incidents, and dispatch follow-up actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            View history
          </Button>
          <Button type="button" className="gap-2">
            <BellRing className="h-4 w-4" />
            Silence alarms
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {ALERTS.map((alert) => (
          <Card key={alert.id} className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {alert.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {alert.location} · ID {alert.id}
                </CardDescription>
              </div>
              <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{alert.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{alert.timestamp}</span>
                <Button type="button" variant="secondary" className="gap-2">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Acknowledge
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
