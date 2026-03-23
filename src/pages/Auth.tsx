import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/bunnyworks-logo.png";
import { z } from "zod";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";

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
          <img src={logo} alt="BunnyWorksOS" className="h-20 w-auto mx-auto mb-4 animate-neon-glow" />
          <h1 className="text-3xl font-bold gradient-text tracking-wider">BUNNYWORKS OS</h1>
          <p className="text-muted-foreground mt-2">
            {mode === "signin" ? "Welcome back" : "Create your agency account"}
          </p>
        </div>

        {/* Telegram Login */}
        <div className="space-y-3">
          <TelegramLoginButton botName="BunnyWorksBot" />
          
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
