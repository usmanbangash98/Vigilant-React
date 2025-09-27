import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildLoginUrl, getCookie, cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [{ username, password }, setValues] = useState<LoginValues>({
    username: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const csrfToken = useMemo(
    () => getCookie("csrftoken") || getCookie("csrf") || "",
    [],
  );

  useEffect(() => {
    document.title = "Sign in — VigilantEye";
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message || "Please fix the errors and try again");
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch(buildLoginUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: new URLSearchParams({
          username: parsed.data.username,
          password: parsed.data.password,
        }),
      });

      if (resp.redirected) {
        window.location.href = resp.url;
        return;
      }

      if (resp.ok) {
        const data = await resp.json();
        // Store the authentication token
        login(data.token || "authenticated");

        // Use React Router navigation instead of window.location
        if (data.success && data.redirect) {
          navigate(data.redirect);
        } else {
          navigate("/dashboard"); // Default redirect
        }
        return;
      }

      const contentType = resp.headers.get("Content-Type") || "";
      let message = "Login failed. Check your credentials.";
      if (contentType.includes("application/json")) {
        const data = await resp.json().catch(() => null);
        message = data?.detail || data?.error || message;
      }
      setError(message);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/40 to-background px-4 py-12">
      <div className="pointer-events-none absolute -top-24 right-1/2 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <Card className="relative w-full max-w-5xl overflow-hidden border-border/60 bg-background/80 shadow-2xl shadow-primary/10 backdrop-blur">
        <div className="grid gap-0 md:grid-cols-[1.1fr,1fr]">
          <div className="relative hidden bg-gradient-to-br from-primary to-primary/60 p-8 text-primary-foreground md:flex md:flex-col md:justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                VigilantEye Security Suite
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Stay protected, always.
                </h2>
                <p className="text-sm text-primary-foreground/80">
                  Access real-time monitoring, intelligent alerts, and
                  comprehensive reporting from a single dashboard.
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-primary-foreground/85">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">Enterprise-grade encryption</p>
                  <p className="text-primary-foreground/70">
                    Your credentials and data remain secure with end-to-end
                    protection.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">Instant anomaly alerts</p>
                  <p className="text-primary-foreground/70">
                    Get notified instantly when something needs your attention.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col justify-center p-6 sm:p-10">
            <CardHeader className="space-y-2 p-0">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to continue to VigilantEye
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-6">
              {error && (
                <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive shadow-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username or Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground text-purple-600" />
                    <Input
                      id="username"
                      name="username"
                      autoComplete="username"
                      placeholder="you@example.com"
                      className="pl-9 transition-all duration-150 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30"
                      value={username}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, username: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground text-purple-600" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="pl-9 pr-10 transition-all duration-150 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30"
                      value={password}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, password: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((s) => !s)}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                      )}>
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-muted-foreground/30 text-primary focus-visible:ring-primary/40"
                    />
                    Remember me
                  </label>
                  <a
                    href="/auth/forgot-password"
                    className="font-medium text-primary transition-colors hover:text-primary/80">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full transition-transform duration-150 hover:scale-[1.01]"
                  disabled={submitting}>
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Need an account?{" "}
                <a
                  href="/auth/register"
                  className="font-medium text-primary transition-colors hover:text-primary/80">
                  Contact your administrator
                </a>
                .
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
