import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password — BRAIN STACK CAFE" },
      { name: "description", content: "Set a new password for your BRAIN STACK CAFE account." },
      { property: "og:title", content: "Reset password — BRAIN STACK CAFE" },
      { property: "og:description", content: "Set a new password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ResetPasswordPage() {
  const [mode, setMode] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("set");
    }
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const options: { redirectTo?: string } = {};
    if (typeof window !== "undefined") {
      options.redirectTo = `${window.location.origin}/reset-password`;
    }
    const { error: reqError } = await supabase.auth.resetPasswordForEmail(email, options);
    setLoading(false);
    if (reqError) {
      setError(reqError.message);
      return;
    }
    toast.success("Password reset link sent — check your email");
  };

  const handleSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    toast.success("Password updated — please sign in");
  };

  return (
    <SiteLayout>
      <div className="bsc-container flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md border border-border bg-card p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
          <h1 className="text-center font-display text-2xl font-bold">
            {mode === "request" ? "Reset password" : "Set new password"}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {mode === "request"
              ? "Enter your email and we'll send you a reset link."
              : "Choose a new password for your account."}
          </p>

          {mode === "request" ? (
            <form onSubmit={handleRequest} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Send reset link
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSet} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm">
            <Link to="/auth" className="font-medium text-primary underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
