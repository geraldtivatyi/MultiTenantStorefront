import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  BarChart3, 
  Store, 
  Users, 
  CreditCard, 
  Settings, 
  ExternalLink,
  TrendingUp,
  Menu
} from "lucide-react";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tenants" | "products" | "payments" | "settings">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: activeTab === "dashboard",
  });

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <h1 className="text-lg lg:text-xl font-bold text-primary-brand">Platform Admin</h1>
        <p className="text-xs lg:text-sm text-muted-foreground">Multi-Tenant Dashboard</p>
      </div>
      <nav className="mt-4 lg:mt-6">
        <div className="space-y-1 px-3">
          <button
            onClick={() => handleTabChange("dashboard")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "dashboard"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="mr-3 h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => handleTabChange("tenants")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "tenants"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <Store className="mr-3 h-4 w-4" />
            Tenant Stores
          </button>
          <button
            onClick={() => handleTabChange("products")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "products"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <Users className="mr-3 h-4 w-4" />
            Products
          </button>
          <button
            onClick={() => handleTabChange("payments")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "payments"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <CreditCard className="mr-3 h-4 w-4" />
            Payments
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
            Platform Settings
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary-brand">Admin Dashboard</h1>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle className="text-left text-primary-brand">Admin Menu</SheetTitle>
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
                    {activeTab === "dashboard" && "Dashboard Overview"}
                    {activeTab === "tenants" && "Tenant Management"}
                    {activeTab === "products" && "Product Management"}
                    {activeTab === "payments" && "Payment Management"}
                    {activeTab === "settings" && "Platform Settings"}
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {activeTab === "dashboard" && "Welcome back! Here's what's happening across your platform."}
                    {activeTab === "tenants" && "Manage your tenant stores and configurations."}
                    {activeTab === "products" && "Create and manage products for your tenants."}
                    {activeTab === "payments" && "Monitor payments and transactions across all tenants."}
                    {activeTab === "settings" && "Configure platform-wide settings and preferences."}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand"
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
            {/* Dashboard Overview Tab */}
            {activeTab === "dashboard" && (
              <>
                {dashboardStats ? (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center">
                            <div className="bg-primary-brand/10 rounded-full p-2 sm:p-3">
                              <Store className="text-primary-brand h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tenants</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(dashboardStats as any)?.totalTenants || 0}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              Active store instances
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center">
                            <div className="bg-secondary-brand/10 rounded-full p-2 sm:p-3">
                              <TrendingUp className="text-secondary-brand h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(dashboardStats as any)?.totalRevenue || "R 0.00"}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              From completed payments
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading dashboard statistics...</p>
                  </div>
                )}
              </>
            )}

            {/* Other Tab Content */}
            {activeTab === "tenants" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tenant management interface coming soon...</p>
              </div>
            )}

            {activeTab === "products" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Product management interface coming soon...</p>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Payment management interface coming soon...</p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Platform settings interface coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}