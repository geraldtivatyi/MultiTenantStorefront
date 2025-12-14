import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Storefront } from "@/pages/storefront";
import { ProductDetail } from "@/pages/product-detail";
import { Cart } from "@/pages/cart";
import { Checkout } from "@/pages/checkout";
import { AdminDashboard } from "@/pages/admin-dashboard";
import { MyOrders } from "@/pages/my-orders";
import { AccountSettings } from "@/pages/account-settings";
import { About } from "@/pages/about";
import { Contact } from "@/pages/contact";
import { PrivacyPolicy } from "@/pages/privacy-policy";
import { TermsOfService } from "@/pages/terms-of-service";
import { ShippingInfo } from "@/pages/shipping-info";
import { Search } from "@/pages/search";
import { Login } from "@/pages/login";
import { Register } from "@/pages/register";
import { ForgotPassword } from "@/pages/forgot-password";
import { ResetPassword } from "@/pages/reset-password";
import { VerifyEmail } from "@/pages/verify-email";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "@/components/skeletons";
import { ErrorBoundary } from "@/components/error-boundary";
import { useEffect } from "react";

// Component to handle scroll to top on route changes
function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);
  
  return null;
}

function Router() {
  const { isLoading } = useAuth();

  // Show loading screen during initial authentication check
  if (isLoading) {
    return <AuthLoadingScreen message="Loading application..." />;
  }

  return (
    <WouterRouter>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Storefront} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/search" component={Search} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/shipping-info" component={ShippingInfo} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/my-orders" component={MyOrders} />
        <Route path="/account-settings" component={AccountSettings} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
