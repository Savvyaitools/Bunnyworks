import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { z } from "zod";
import { lovable } from "@/integrations/lovable/index";

type AuthMode = "signin" | "signup";

// Validation schemas
const emailSchema = z.string().trim().email("Please enter a valid email address").max(255, "Email is too long");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long");

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user, profile, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: ""
  });

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (user && !authLoading) {
      if (profile) {
        let destination = "/dashboard";
        if (profile.user_type === "creator") destination = "/portal";
        else if (profile.user_type === "employee") destination = "/employee";
        navigate(destination, { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

  // Force redirect after a short delay if profile takes too long - use auth metadata as fallback
  useEffect(() => {
    if (user && !profile && !authLoading) {
      const timeout = setTimeout(() => {
        // Use user metadata from auth session as fallback
        const userTypeFromMeta = user.user_metadata?.user_type as string | undefined;
        let destination = "/dashboard"; // default for agency
        if (userTypeFromMeta === "creator") destination = "/portal";
        else if (userTypeFromMeta === "employee") destination = "/employee";
        navigate(destination, { replace: true });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, profile, authLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate email
    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    // Validate password
    const passwordResult = passwordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    // Validate name (signup only)
    if (mode === "signup") {
      const nameResult = nameSchema.safeParse(formData.fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        // Only agency signup is allowed - creators/employees get accounts from their agency
        const { error } = await signUp(formData.email.trim(), formData.password, formData.fullName.trim(), "agency");
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in.");
          } else {
            toast.error(error.message);
          }
        } else {
          setShowEmailVerification(true);
        }
      } else {
        const { error } = await signIn(formData.email.trim(), formData.password);
        if (error) {
          toast.error("Invalid email or password");
        } else {
          toast.success("Welcome back!");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Google sign-in failed. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show email verification message after signup
  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="w-full max-w-md space-y-6 animate-fade-in relative z-10 text-center">
          <div className="glass-card p-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-muted-foreground">
              We've sent a verification link to <span className="font-medium text-foreground">{formData.email}</span>. 
              Please click the link to verify your account.
            </p>
            <Button variant="outline" className="w-full" onClick={() => { setShowEmailVerification(false); setMode("signin"); }}>
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Back to home */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      
      <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center">
          <img src={logo} alt="Creator OS" className="h-20 w-auto mx-auto mb-4 animate-neon-glow" />
          <h1 className="text-3xl font-bold gradient-text tracking-wider">CREATOR OS</h1>
          <p className="text-muted-foreground mt-2">
            {mode === "signin" ? "Welcome back" : "Create your agency account"}
          </p>
        </div>

        {/* Google Login */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base gap-3"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base gap-3"
            onClick={async () => {
              setGoogleLoading(true);
              try {
                const { error } = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error("Apple sign-in failed. Please try again.");
              } catch {
                toast.error("An unexpected error occurred");
              } finally {
                setGoogleLoading(false);
              }
            }}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            )}
            Continue with Apple
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Agency Name</Label>
              <Input 
                id="fullName" 
                type="text" 
                placeholder="My Agency" 
                value={formData.fullName} 
                onChange={e => handleInputChange("fullName", e.target.value)}
                className={cn(
                  "bg-muted/50 border-border focus:border-primary",
                  errors.fullName && "border-destructive focus:border-destructive"
                )}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={formData.email} 
              onChange={e => handleInputChange("email", e.target.value)}
              className={cn(
                "bg-muted/50 border-border focus:border-primary",
                errors.email && "border-destructive focus:border-destructive"
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                value={formData.password} 
                onChange={e => handleInputChange("password", e.target.value)}
                className={cn(
                  "bg-muted/50 border-border focus:border-primary pr-10",
                  errors.password && "border-destructive focus:border-destructive"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
            {mode === "signup" && !errors.password && (
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 glow-sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating agency..."}
              </>
            ) : mode === "signin" ? "Sign In" : "Create Agency"}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">
            {mode === "signin" ? "Don't have an agency?" : "Already have an account?"}
            <button 
              type="button" 
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setErrors({});
              }} 
              className="ml-2 text-primary hover:underline font-medium"
            >
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
          
          {/* Staff login link */}
          <Link 
            to="/employee-login" 
            className="block text-sm font-medium text-foreground bg-muted/50 border border-border rounded-lg px-4 py-3 hover:bg-muted hover:border-primary/50 transition-all"
          >
            🎭 Employee or Creator? <span className="text-primary font-semibold hover:underline">Sign in here →</span>
          </Link>
        </div>

        {/* Terms & Privacy */}
        {mode === "signup" && (
          <p className="text-xs text-center text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
