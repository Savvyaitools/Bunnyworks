import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/bunnyworks-logo.png";
import { z } from "zod";
import { lovable } from "@/integrations/lovable/index";

// Validation schemas
const emailSchema = z.string().trim().email("Please enter a valid email address").max(255, "Email is too long");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long");

export default function EmployeeAuth() {
  const navigate = useNavigate();
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (user && !authLoading) {
      if (profile) {
        if (profile.user_type === "employee") {
          navigate("/employee", { replace: true });
        } else if (profile.user_type === "creator") {
          navigate("/portal", { replace: true });
        } else {
          // Agency users go to main dashboard
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [user, profile, authLoading, navigate]);

  // Fallback redirect using auth metadata
  useEffect(() => {
    if (user && !profile && !authLoading) {
      const timeout = setTimeout(() => {
        const userTypeFromMeta = user.user_metadata?.user_type as string | undefined;
        if (userTypeFromMeta === "employee") {
          navigate("/employee", { replace: true });
        } else {
          let destination = "/dashboard";
          if (userTypeFromMeta === "creator") destination = "/portal";
          navigate(destination, { replace: true });
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, profile, authLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
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
      const { error } = await signIn(formData.email.trim(), formData.password);
      if (error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        {/* Logo and Header */}
        <div className="text-center">
          <img src={logo} alt="BunnyWorksOS" className="h-20 w-auto mx-auto mb-4 animate-neon-glow" />
          <h1 className="text-3xl font-bold gradient-text tracking-wider">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your Creator or Team dashboard
          </p>
        </div>

        {/* Google Login */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base gap-3"
            onClick={async () => {
              setGoogleLoading(true);
              try {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error("Google sign-in failed. Please try again.");
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
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={formData.email} 
              onChange={e => handleInputChange("email", e.target.value)}
              className={cn(
                "bg-muted/50 border-border focus:border-accent",
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
                  "bg-muted/50 border-border focus:border-accent pr-10",
                  errors.password && "border-destructive focus:border-destructive"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 glow-sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : "Sign In"}
          </Button>
        </form>

        {/* Help Text */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Your login credentials are provided by your agency manager.
          </p>
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Agency Owner? <span className="text-primary hover:underline">Sign in here</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
