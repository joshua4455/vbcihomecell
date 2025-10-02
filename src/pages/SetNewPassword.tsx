import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const SetNewPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, requestPasswordReset } = useAuth();
  const [initLoading, setInitLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkErrorDesc, setLinkErrorDesc] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // First, try new-style code exchange (Supabase may send ?code=...)
        try {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(url.href as any);
            if (!error && data?.session && mounted) {
              setHasSession(true);
              // Clean query params after successful exchange
              window.history.replaceState({}, document.title, url.pathname);
            }
          }
        } catch {
          // Ignore; we will fall back to hash token handling next
        }

        // Try to establish a recovery session from URL fragment if present
        const hash = window.location.hash || '';
        if (hash.startsWith('#')) {
          const params = new URLSearchParams(hash.slice(1));
          // Capture error details if present
          const err = params.get('error');
          const desc = params.get('error_description');
          if (err) setLinkError(err);
          if (desc) setLinkErrorDesc(desc.replace(/\+/g, ' '));

          // If this is a recovery link, attempt to set the session explicitly
          const type = params.get('type');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (type === 'recovery' && accessToken && refreshToken) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              } as any);
              if (!error && data?.session && mounted) {
                setHasSession(true);
                // Clean sensitive tokens from URL after successful session set
                window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
              }
            } catch {
              // Non-fatal: we'll fall back to normal session retrieval below
            }
          }
        }
      } finally {
        // Always query for current session at the end
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setHasSession(!!session);
        setInitLoading(false);
      }
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying reset link...</CardTitle>
            <CardDescription>Please wait a moment.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              Open the password reset link we sent to your email. If you don’t see it, check your spam folder. You can request a new link from the login page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {linkErrorDesc ? linkErrorDesc : 'This page can only be used from the secure link in your email. The link will sign you in temporarily so you can set a new password.'}
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-3">
              <Label htmlFor="resend-email">Did the link expire? Resend a new reset email</Label>
              <Input
                id="resend-email"
                type="email"
                placeholder="you@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (!resendEmail) return;
                    setResendLoading(true);
                    const res = await requestPasswordReset(resendEmail);
                    setResendLoading(false);
                    if (res.success) {
                      toast({ title: 'Reset email sent', description: res.message || 'Please check your inbox for the new link.' });
                    } else {
                      toast({ title: 'Failed to send', description: res.error || 'Please try again.', variant: 'destructive' });
                    }
                  }}
                  disabled={!resendEmail || resendLoading}
                >
                  {resendLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Reset Email
                </Button>
                <Button onClick={() => navigate('/login')} variant="outline">
                  Back to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      // 1) Update password
      const { error: passErr } = await supabase.auth.updateUser({ password });
      if (passErr) throw passErr;

      // 2) Clear the require_password_reset flag
      const { error: metaErr } = await supabase.auth.updateUser({ data: { require_password_reset: false } });
      if (metaErr) throw metaErr;

      toast({ title: "Password updated", description: "Redirecting to your dashboard..." });

      // 3) Navigate based on profile role if available
      const role = (user as any)?.role;
      if (role === 'super-admin') navigate('/admin');
      else if (role === 'zone-leader') navigate('/zone-dashboard');
      else if (role === 'area-leader') navigate('/area-dashboard');
      else navigate('/dashboard');
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set a New Password</CardTitle>
          <CardDescription>For your security, please set a new password before continuing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetNewPassword;
