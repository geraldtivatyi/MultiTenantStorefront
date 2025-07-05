import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  ShoppingCart,
  DollarSign,
  Users,
  Menu,
  ExternalLink,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/use-tenant";

export function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "analytics" | "settings">("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor stats
  const { data: vendorStats } = useQuery({
    queryKey: ["/api/vendor/stats"],
    enabled: activeTab === "overview",
  });

  // Initialize WhatsApp phone from tenant data
  useEffect(() => {
    if ((tenant as any)?.whatsappPhone) {
      setWhatsappPhone((tenant as any).whatsappPhone);
    }
  }, [tenant]);

  // Update WhatsApp phone mutation
  const updateWhatsAppMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest("/api/tenant/whatsapp", "PUT", { whatsappPhone: phone });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp settings updated",
        description: "Your WhatsApp phone number has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/storefront/tenant"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update WhatsApp settings.",
        variant: "destructive",
      });
    },
  });

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <h1 className="text-lg lg:text-xl font-bold text-primary-brand">{tenant?.name}</h1>
        <p className="text-xs lg:text-sm text-muted-foreground">Vendor Dashboard</p>
      </div>
      <nav className="mt-4 lg:mt-6">
        <div className="space-y-1 px-3">
          <button
            onClick={() => handleTabChange("overview")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "overview"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="mr-3 h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => handleTabChange("products")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "products"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <Package className="mr-3 h-4 w-4" />
            Products
          </button>
          <button
            onClick={() => handleTabChange("orders")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "orders"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <ShoppingCart className="mr-3 h-4 w-4" />
            Orders
          </button>
          <button
            onClick={() => handleTabChange("analytics")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "analytics"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <TrendingUp className="mr-3 h-4 w-4" />
            Analytics
          </button>
          <button
            onClick={() => handleTabChange("settings")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "settings"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary-brand">Vendor Dashboard</h1>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle className="text-left text-primary-brand">Dashboard Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {sidebarContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white shadow-lg h-screen fixed left-0 top-0">
          {sidebarContent}
        </div>

        {/* Main Content */}
        <div className="w-full lg:ml-64 pt-16 lg:pt-0">
          {/* Top Bar */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {activeTab === "overview" && "Store Overview"}
                    {activeTab === "products" && "Product Management"}
                    {activeTab === "orders" && "Order Management"}
                    {activeTab === "analytics" && "Store Analytics"}
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {activeTab === "overview" && "Welcome back! Here's how your store is performing."}
                    {activeTab === "products" && "Manage your product inventory and listings."}
                    {activeTab === "orders" && "Track and manage customer orders."}
                    {activeTab === "analytics" && "Analyze your store's performance and trends."}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Store
                  </a>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {vendorStats ? (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center">
                            <div className="bg-green-100 rounded-full p-2 sm:p-3">
                              <DollarSign className="text-green-600 h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(vendorStats as any)?.totalRevenue || "R 0.00"}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              This month
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-2 sm:p-3">
                              <ShoppingCart className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Orders</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(vendorStats as any)?.totalOrders || 0}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              All time
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center">
                            <div className="bg-primary-brand/10 rounded-full p-2 sm:p-3">
                              <Package className="text-primary-brand h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Products</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(vendorStats as any)?.totalProducts || 0}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              Active listings
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center">
                            <div className="bg-purple-100 rounded-full p-2 sm:p-3">
                              <Users className="text-purple-600 h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Customers</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(vendorStats as any)?.totalCustomers || 0}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              Unique buyers
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading store statistics...</p>
                  </div>
                )}
              </>
            )}

            {/* Other Tab Content */}
            {activeTab === "products" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Product management interface coming soon...</p>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Order management interface coming soon...</p>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Settings</h2>
                  <p className="text-muted-foreground">Manage your store settings and notifications</p>
                </div>

                {/* WhatsApp Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      WhatsApp Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Receive WhatsApp notifications when new orders are placed in your store. 
                      Enter your WhatsApp phone number in international format (e.g., +27823456789).
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-phone">WhatsApp Phone Number</Label>
                      <Input
                        id="whatsapp-phone"
                        type="tel"
                        placeholder="+27823456789"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Include the country code (e.g., +27 for South Africa)
                      </p>
                    </div>

                    <Button
                      onClick={() => updateWhatsAppMutation.mutate(whatsappPhone)}
                      disabled={updateWhatsAppMutation.isPending}
                      className="bg-primary-brand hover:bg-primary-brand/90"
                    >
                      {updateWhatsAppMutation.isPending ? "Saving..." : "Save WhatsApp Settings"}
                    </Button>

                    {(tenant as any)?.whatsappPhone && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          ✓ WhatsApp notifications are enabled for: {(tenant as any).whatsappPhone}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Store Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Store Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Store Name</Label>
                        <p className="font-medium">{tenant?.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Subdomain</Label>
                        <p className="font-medium">{tenant?.subdomain}.{window.location.hostname}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}