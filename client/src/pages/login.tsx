import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTenant } from "@/hooks/use-tenant";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: tenant } = useTenant();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest("/api/auth/login", "POST", data);
    },
    onSuccess: (response: any) => {
      const { user, redirectUrl } = response;
      
      // Show role-specific welcome message
      let welcomeMessage = "You have been successfully logged in.";
      if (user.role === 'platform_admin') {
        welcomeMessage = "Welcome back, Platform Administrator!";
      } else if (user.role === 'tenant_owner') {
        welcomeMessage = "Welcome back to your vendor dashboard!";
      }
      
      toast({
        title: "Welcome back!",
        description: welcomeMessage,
      });
      
      // Redirect to role-specific dashboard or home
      const targetUrl = redirectUrl || "/";
      window.location.href = targetUrl;
    },
    onError: (error: any) => {
      let message = "Login failed. Please try again.";
      
      if (error.message.includes("INVALID_CREDENTIALS")) {
        message = "Invalid email or password. Please check your credentials.";
      } else if (error.message.includes("ACCOUNT_DISABLED")) {
        message = "Your account has been disabled. Please contact support.";
      }
      
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-brand/5 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary-brand mb-2">
              {tenant?.name || "Creative Crafts Studio"}
            </h1>
          </Link>
          <p className="text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <LogIn className="h-6 w-6" />
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your.email@example.com" 
                          type="email"
                          autoComplete="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter your password" 
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  size="lg"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            {loginMutation.error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">
                  {loginMutation.error.message || "An error occurred during login"}
                </p>
              </div>
            )}

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary-brand hover:underline font-medium">
                  Create one here
                </Link>
              </p>
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary-brand">
                ← Back to store
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Account Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <h3 className="font-medium text-sm mb-2">Demo Account</h3>
          <p className="text-xs text-muted-foreground mb-2">
            You can use this demo account to test the platform:
          </p>
          <div className="text-xs font-mono space-y-1">
            <div><strong>Email:</strong> demo@creativecrafts.co.za</div>
            <div><strong>Password:</strong> demo123</div>
          </div>
        </div>
      </div>
    </div>
  );
}