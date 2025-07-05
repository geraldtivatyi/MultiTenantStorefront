import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  Store, 
  Users, 
  CreditCard, 
  Settings, 
  ExternalLink,
  TrendingUp,
  Menu,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Send
} from "lucide-react";

function SettingsTab() {
  const { toast } = useToast();
  const [emailForm, setEmailForm] = useState({
    email: "",
    subject: "",
    message: ""
  });
  const [whatsappForm, setWhatsappForm] = useState({
    phone: "",
    message: ""
  });

  // Get email configuration
  const { data: emailConfig } = useQuery({
    queryKey: ["/api/email/config"],
  });

  // Get WhatsApp configuration
  const { data: whatsappConfig } = useQuery({
    queryKey: ["/api/whatsapp/config"],
  });

  // Email test mutation
  const emailTestMutation = useMutation({
    mutationFn: async (data: { email: string; subject: string; message: string }) => {
      return await apiRequest("/api/email/test", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Test email sent successfully!",
      });
      setEmailForm({ email: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast({
        title: "Email Failed",
        description: "Failed to send test email. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  // WhatsApp test mutation
  const whatsappTestMutation = useMutation({
    mutationFn: async (data: { phone: string; message: string }) => {
      return await apiRequest("/api/whatsapp/test", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp Sent",
        description: "Test WhatsApp message sent successfully!",
      });
      setWhatsappForm({ phone: "", message: "" });
    },
    onError: (error) => {
      toast({
        title: "WhatsApp Failed",
        description: "Failed to send test WhatsApp message. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  const handleEmailTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.email || !emailForm.subject || !emailForm.message) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all email fields.",
        variant: "destructive",
      });
      return;
    }
    emailTestMutation.mutate(emailForm);
  };

  const handleWhatsAppTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappForm.phone || !whatsappForm.message) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all WhatsApp fields.",
        variant: "destructive",
      });
      return;
    }
    whatsappTestMutation.mutate(whatsappForm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground">
          Configure notification services and test system integrations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {emailConfig?.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                Status: {emailConfig?.configured ? "Configured" : "Not Configured"}
              </span>
            </div>
            
            {emailConfig?.configured && (
              <div>
                <p className="text-sm text-muted-foreground">
                  From Email: {emailConfig.fromEmail}
                </p>
              </div>
            )}

            <form onSubmit={handleEmailTest} className="space-y-3">
              <div>
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="test-subject">Subject</Label>
                <Input
                  id="test-subject"
                  placeholder="Test Email Subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="test-message">Message</Label>
                <Textarea
                  id="test-message"
                  placeholder="Test email message content..."
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              <Button 
                type="submit" 
                disabled={!emailConfig?.configured || emailTestMutation.isPending}
                className="w-full"
              >
                {emailTestMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* WhatsApp Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {whatsappConfig?.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                Status: {whatsappConfig?.configured ? "Configured" : "Not Configured"}
              </span>
            </div>

            {whatsappConfig?.configured && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Phone Number ID: {whatsappConfig.phoneNumberId}
                </p>
              </div>
            )}

            <form onSubmit={handleWhatsAppTest} className="space-y-3">
              <div>
                <Label htmlFor="test-phone">Test Phone Number</Label>
                <Input
                  id="test-phone"
                  placeholder="+27812345678"
                  value={whatsappForm.phone}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="test-whatsapp-message">Message</Label>
                <Textarea
                  id="test-whatsapp-message"
                  placeholder="Test WhatsApp message content..."
                  value={whatsappForm.message}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              <Button 
                type="submit" 
                disabled={!whatsappConfig?.configured || whatsappTestMutation.isPending}
                className="w-full"
              >
                {whatsappTestMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test WhatsApp
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Automatic emails are sent to vendors when new orders are received and to customers when orders are confirmed.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">WhatsApp Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Automatic WhatsApp messages are sent to vendors when new orders are received (if phone number is configured).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
              <SettingsTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}