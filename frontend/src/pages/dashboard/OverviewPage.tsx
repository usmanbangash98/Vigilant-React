import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, History, ShieldAlert, Users } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active cameras
            </CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">16</div>
            <p className="text-xs text-muted-foreground">+2 since yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding alerts
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">5</div>
            <p className="text-xs text-muted-foreground">Respond within 2 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved incidents
            </CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">128</div>
            <p className="text-xs text-muted-foreground">+18% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Authorized users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">42</div>
            <p className="text-xs text-muted-foreground">3 pending invitations</p>
          </CardContent>
        </Card>
      </section> */}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-dashed border-border/60">
          <CardHeader>
            <CardTitle>Identify thief</CardTitle>
            <CardDescription>
              Upload images or use your webcam to cross-match with the
              VigilantEye database.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Start a session to capture and analyze footage in real-time.
            </div>
            <Button type="button" className="gap-2">
              <Camera className="h-4 w-4" />
              Start detection
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-border/60">
          <CardHeader>
            <CardTitle>View reports</CardTitle>
            <CardDescription>
              Access detection history, executive summaries, and exportable
              analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Drill into performance metrics and anomaly timelines.
            </div>
            <Button type="button" variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              View reports
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle>Manage users</CardTitle>
            <CardDescription>
              Review role assignments and update access policies for your
              organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Maintain least-privilege principles with quick approvals and
              revocations.
            </div>
            <Button type="button" variant="secondary" className="gap-2">
              <Users className="h-4 w-4" />
              Manage users
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
