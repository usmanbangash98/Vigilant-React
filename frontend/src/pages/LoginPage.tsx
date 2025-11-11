import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/20 px-4 py-12">
      <Card className="w-full max-w-md border border-border/60 bg-background shadow-xl">
        <div className="flex flex-col p-6 sm:p-8">
          <CardHeader className="space-y-3 p-0 text-center">
            <CardTitle className="text-2xl font-semibold">
              Sign in to your account
            </CardTitle>
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
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder="name@example.com"
                    className="pl-9 transition-all duration-150 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30"
                    value={username}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, username: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

            <div className="text-center text-sm text-muted-foreground mt-4">
              <p className="text-sm text-muted-foreground">
                Don't have an account? Contact the administrator to get an
                account.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
