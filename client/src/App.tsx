import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Storefront} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/my-orders" component={MyOrders} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/search" component={Search} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/shipping-info" component={ShippingInfo} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
