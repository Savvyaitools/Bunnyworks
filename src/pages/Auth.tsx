import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type UserType = "agency" | "creator";
type AuthMode = "signin" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [userType, setUserType] = useState<UserType>("agency");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!formData.fullName.trim()) {
          toast.error("Please enter your full name");
          setLoading(false);
          return;
        }
        const { error } = await signUp(formData.email, formData.password, formData.fullName, userType);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! Redirecting...");
          // Redirect based on user type
          setTimeout(() => {
            navigate(userType === "creator" ? "/portal" : "/");
          }, 1000);
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast.error("Invalid email or password");
        } else {
          toast.success("Welcome back!");
          // Will redirect based on profile type in App.tsx
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Creator OS
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* User Type Selector (only for signup) */}
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType("agency")}
              className={cn(
                "glass-card p-4 text-center transition-all duration-200",
                userType === "agency"
                  ? "border-primary bg-primary/10"
                  : "hover:border-muted-foreground/50"
              )}
            >
              <Building2 className={cn(
                "h-8 w-8 mx-auto mb-2",
                userType === "agency" ? "text-primary" : "text-muted-foreground"
              )} />
              <p className={cn(
                "font-medium",
                userType === "agency" ? "text-foreground" : "text-muted-foreground"
              )}>
                Agency Staff
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Manage creators & team
              </p>
            </button>
            <button
              type="button"
              onClick={() => setUserType("creator")}
              className={cn(
                "glass-card p-4 text-center transition-all duration-200",
                userType === "creator"
                  ? "border-accent bg-accent/10"
                  : "hover:border-muted-foreground/50"
              )}
            >
              <Sparkles className={cn(
                "h-8 w-8 mx-auto mb-2",
                userType === "creator" ? "text-accent" : "text-muted-foreground"
              )} />
              <p className={cn(
                "font-medium",
                userType === "creator" ? "text-foreground" : "text-muted-foreground"
              )}>
                Creator
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Access your portal
              </p>
            </button>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required={mode === "signup"}
                className="bg-muted/50 border-border focus:border-primary"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-muted/50 border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="bg-muted/50 border-border focus:border-primary"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 shadow-glow-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              mode === "signin" ? "Sign In" : "Create Account"
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center">
          <p className="text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="ml-2 text-primary hover:underline font-medium"
            >
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
