import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CalendarRange, Download, FileText } from "lucide-react";

const REPORTS = [
  {
    id: "weekly-summary",
    name: "Weekly incident summary",
    description:
      "Analytics covering all endpoints and alerts for the last 7 days.",
    generated: "Sep 18, 2025",
    size: "2.3 MB",
  },
  {
    id: "camera-uptime",
    name: "Camera uptime breakdown",
    description: "Availability metrics for every live feed in VigilantEye.",
    generated: "Sep 17, 2025",
    size: "1.1 MB",
  },
  {
    id: "badge-access",
    name: "Badge access audit",
    description: "Door events and denied entries grouped by location.",
    generated: "Sep 17, 2025",
    size: "3.8 MB",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Operational reports
          </h2>
          <p className="text-sm text-muted-foreground">
            Export detailed analytics to share with leadership and incident
            response teams.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            Select date range
          </Button>
          <Button type="button" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Generate custom report
          </Button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.id} className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {report.name}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                Generated {report.generated}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>File size: {report.size}</span>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button type="button" variant="ghost" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
