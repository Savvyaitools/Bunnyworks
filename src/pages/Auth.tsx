import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff, Lock, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/bunnyworks-logo.png";
import { z } from "zod";

type AuthMode = "signin";

// Validation schemas
const emailSchema = z.string().trim().email("Please enter a valid email address").max(255, "Email is too long");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long");

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const [mode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
          <p className="text-muted-foreground mt-2">Welcome back</p>
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

        {/* Invitation only notice */}
        <div className="text-center space-y-3">
          <div className="glass-card p-5 space-y-3 text-left">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Lock className="h-4 w-4" />
              <span className="uppercase tracking-wider text-sm">Invitation Only</span>
            </div>
            <p className="text-sm text-muted-foreground">
              BunnyWorks OS is invitation only. To request access, DM us on Instagram for approval.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <a
                href="https://instagram.com/pbf_ofm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm font-medium bg-muted/50 border border-border rounded-lg px-4 py-2.5 hover:border-primary/50 hover:bg-muted transition-all"
              >
                <Instagram className="h-4 w-4 text-primary" />
                DM @pbf_ofm on Instagram
              </a>
            </div>
          </div>
          
          {/* Staff login link */}
          <Link 
            to="/employee-login" 
            className="block text-sm font-medium text-foreground bg-muted/50 border border-border rounded-lg px-4 py-3 hover:bg-muted hover:border-primary/50 transition-all"
          >
            🎭 Employee or Creator? <span className="text-primary font-semibold hover:underline">Sign in here →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
