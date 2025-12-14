import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, Mail, Loader2 } from "lucide-react";

export function VerifyEmail() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const token = urlParams.get('token');
  
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const { data, error } = useQuery({
    queryKey: ['/api/auth/verify-email', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('Verification token is missing');
      }
      const response = await apiRequest(`/api/auth/verify-email?token=${token}`, "GET");
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data?.success) {
      setVerificationStatus('success');
      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully!",
      });
    } else if (error) {
      setVerificationStatus('error');
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid or expired verification token",
        variant: "destructive",
      });
    }
  }, [data, error, toast]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-brand/5 to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
              <CardDescription>
                Email verification link is missing or invalid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button className="w-full">
                  Go to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-brand/5 to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">Verifying Email</CardTitle>
              <CardDescription>
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-brand/5 to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Email Verified</CardTitle>
              <CardDescription>
                Your email address has been verified successfully!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You can now enjoy all the features of your account.
              </p>
              <div className="space-y-2">
                <Link href="/">
                  <Button className="w-full">
                    Go to Home
                  </Button>
                </Link>
                <Link href="/account-settings">
                  <Button variant="outline" className="w-full">
                    Account Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-brand/5 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
            <CardDescription>
              The verification link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please request a new verification email from your account settings.
            </p>
            <div className="space-y-2">
              <Link href="/login">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

