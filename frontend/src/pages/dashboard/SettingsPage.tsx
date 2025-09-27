import { useEffect, useMemo, useState } from "react";
import { buildBackendUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [account, setAccount] = useState<{
    id: number;
    name: string;
    surname: string;
    email: string;
  } | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const currentUserEndpoint = useMemo(
    () => buildBackendUrl("/api/current-user"),
    [],
  );

  useEffect(() => {
    let aborted = false;
    async function loadAccount() {
      setLoadingAccount(true);
      setAccountError(null);
      try {
        const resp = await fetch(currentUserEndpoint, {
          method: "GET",
          credentials: "include",
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => null);
          const message =
            data?.error || data?.detail || "Unable to load account details.";
          if (!aborted) setAccountError(message);
          return;
        }
        const data = await resp.json();
        if (!aborted) setAccount(data.user || null);
      } catch (error) {
        if (!aborted)
          setAccountError(
            "Network error while loading account details. Please try again.",
          );
      } finally {
        if (!aborted) setLoadingAccount(false);
      }
    }

    loadAccount();
    return () => {
      aborted = true;
    };
  }, [currentUserEndpoint]);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border/70 bg-background/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Logged in as
            </p>
            {account ? (
              <div>
                <p className="text-base font-semibold text-foreground">
                  {account.name} {account.surname}
                </p>
                <p className="text-sm text-muted-foreground">{account.email}</p>
              </div>
            ) : loadingAccount ? (
              <p className="text-sm text-muted-foreground">Loading account…</p>
            ) : accountError ? (
              <p className="text-sm text-destructive">{accountError}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No account details available.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Workspace settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure notification rules, contact details, and organizational
          preferences.
        </p>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
          <CardDescription>
            Primary notification recipients for VigilantEye status updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="security-contact">Security lead email</Label>
              <Input
                id="security-contact"
                placeholder="security@vigilanteye.ai"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operations-contact">
                Operations distribution list
              </Label>
              <Input
                id="operations-contact"
                placeholder="ops-team@vigilanteye.ai"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sms-number">SMS escalation number</Label>
            <Input id="sms-number" placeholder="+1 (555) 012-9987" />
          </div>
          <Button type="button" className="gap-2">
            <Save className="h-4 w-4" />
            Save contact details
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Notification channels</CardTitle>
          <CardDescription>
            Choose how VigilantEye should reach on-call responders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Email alerts</p>
              <p className="text-xs text-muted-foreground">
                Receive summaries and critical incidents via email.
              </p>
            </div>
            <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">SMS alerts</p>
              <p className="text-xs text-muted-foreground">
                Enable SMS escalation for priority 1 incidents.
              </p>
            </div>
            <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
          </div>
          <Button type="button" variant="secondary" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Apply notification settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
