import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Settings,
  Truck,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Calendar,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/use-tenant";

export function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "analytics" | "delivery" | "settings">("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  
  // Delivery settings state
  const [deliveryOptions, setDeliveryOptions] = useState<string[]>(["collection"]);
  const [pudoPreferredLocker, setPudoPreferredLocker] = useState("");
  const [lockerSearchTerm, setLockerSearchTerm] = useState("");
  
  // Collection address fields
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor stats
  const { data: vendorStats } = useQuery({
    queryKey: ["/api/vendor/stats"],
    enabled: activeTab === "overview",
  });

  // Fetch Pudo lockers for dropdown
  const { data: pudoLockers } = useQuery({
    queryKey: ["/api/pudo/lockers"],
    enabled: activeTab === "delivery",
  });

  // Process and sort lockers based on collection city and search term
  const processedLockers = React.useMemo(() => {
    if (!pudoLockers || !Array.isArray(pudoLockers)) return [];
    
    let filteredLockers = pudoLockers.filter((locker: any) => 
      locker.id && locker.id.trim() !== ''
    );

    // Apply search filter
    if (lockerSearchTerm.trim()) {
      const searchLower = lockerSearchTerm.toLowerCase();
      filteredLockers = filteredLockers.filter((locker: any) =>
        locker.name?.toLowerCase().includes(searchLower) ||
        locker.address?.toLowerCase().includes(searchLower) ||
        locker.city?.toLowerCase().includes(searchLower) ||
        locker.province?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by proximity to collection city
    const collectionCity = city.trim().toLowerCase();
    if (collectionCity) {
      filteredLockers.sort((a: any, b: any) => {
        const aCity = a.city?.toLowerCase() || '';
        const bCity = b.city?.toLowerCase() || '';
        
        // Exact city match first
        const aExactMatch = aCity === collectionCity;
        const bExactMatch = bCity === collectionCity;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Partial city match second
        const aPartialMatch = aCity.includes(collectionCity) || collectionCity.includes(aCity);
        const bPartialMatch = bCity.includes(collectionCity) || collectionCity.includes(bCity);
        
        if (aPartialMatch && !bPartialMatch) return -1;
        if (!aPartialMatch && bPartialMatch) return 1;
        
        // Then sort alphabetically by name
        return (a.name || '').localeCompare(b.name || '');
      });
    } else {
      // If no collection city, just sort alphabetically by name
      filteredLockers.sort((a: any, b: any) => 
        (a.name || '').localeCompare(b.name || '')
      );
    }

    return filteredLockers;
  }, [pudoLockers, lockerSearchTerm, city]);

  // Initialize settings from tenant data
  useEffect(() => {
    if (tenant) {
      const t = tenant as any;
      if (t.whatsappPhone) setWhatsappPhone(t.whatsappPhone);
      if (t.deliveryOptions) setDeliveryOptions(t.deliveryOptions);
      if (t.pudoPreferredLocker) setPudoPreferredLocker(t.pudoPreferredLocker);
      
      // Parse collection address if it exists
      if (t.pudoCollectionAddress) {
        try {
          const address = JSON.parse(t.pudoCollectionAddress);
          setStreetAddress(address.streetAddress || "");
          setSuburb(address.suburb || "");
          setCity(address.city || "");
          setPostalCode(address.postalCode || "");
        } catch (e) {
          // If it's not JSON, treat as legacy string address
          setStreetAddress(t.pudoCollectionAddress);
        }
      }
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

  // Update delivery settings mutation
  const updateDeliveryMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest("/api/tenant/delivery", "PUT", settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Delivery settings updated",
        description: "Your delivery options have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/storefront/tenant"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update delivery settings.",
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
            onClick={() => handleTabChange("delivery")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "delivery"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <Truck className="mr-3 h-4 w-4" />
            Delivery
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

            {/* Products Tab Content */}
            {activeTab === "products" && (
              <ProductsManagement />
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

            {activeTab === "delivery" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Delivery Settings</h2>
                  <p className="text-muted-foreground">Configure your delivery options and Pudo settings</p>
                </div>

                {/* Delivery Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Options</CardTitle>
                    <p className="text-muted-foreground">Select which delivery methods you want to offer</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="collection"
                          checked={deliveryOptions.includes("collection")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDeliveryOptions([...deliveryOptions, "collection"]);
                            } else {
                              setDeliveryOptions(deliveryOptions.filter(opt => opt !== "collection"));
                            }
                          }}
                        />
                        <Label htmlFor="collection">Collection - Customers collect from your store</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="standard_delivery"
                          checked={deliveryOptions.includes("standard_delivery")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDeliveryOptions([...deliveryOptions, "standard_delivery"]);
                            } else {
                              setDeliveryOptions(deliveryOptions.filter(opt => opt !== "standard_delivery"));
                            }
                          }}
                        />
                        <Label htmlFor="standard_delivery">Standard Delivery - Direct to customer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pudo"
                          checked={deliveryOptions.includes("pudo")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDeliveryOptions([...deliveryOptions, "pudo"]);
                            } else {
                              setDeliveryOptions(deliveryOptions.filter(opt => opt !== "pudo"));
                            }
                          }}
                        />
                        <Label htmlFor="pudo">Pudo Locker Delivery - Via Courier Guy lockers</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pudo Configuration */}
                {deliveryOptions.includes("pudo") && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pudo Configuration</CardTitle>
                      <p className="text-muted-foreground">Configure your Pudo delivery settings</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Pudo delivery service is centrally configured for all stores. You just need to set up your collection address and preferred locker below.
                        </p>
                      </div>

                      <div>
                        <Label>Collection Address</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Address where Courier Guy will collect items from your store
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="streetAddress">Street Address</Label>
                            <Input
                              id="streetAddress"
                              value={streetAddress}
                              onChange={(e) => setStreetAddress(e.target.value)}
                              placeholder="123 Main Street"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="suburb">Suburb</Label>
                            <Input
                              id="suburb"
                              value={suburb}
                              onChange={(e) => setSuburb(e.target.value)}
                              placeholder="Sandton"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Johannesburg"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                              id="postalCode"
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                              placeholder="2196"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="pudoPreferredLocker">Preferred Locker Location (Optional)</Label>
                        
                        {/* Search input */}
                        <div className="mt-1 mb-2">
                          <Input
                            placeholder="Search by locker name, address, or city..."
                            value={lockerSearchTerm}
                            onChange={(e) => setLockerSearchTerm(e.target.value)}
                            className="text-sm"
                          />
                          {lockerSearchTerm && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Showing {processedLockers.length} result{processedLockers.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>

                        <Select value={pudoPreferredLocker} onValueChange={setPudoPreferredLocker}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a preferred locker location" />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {processedLockers.length > 0 ? (
                              <>
                                {city && !lockerSearchTerm && (
                                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                                    Lockers in {city} shown first
                                  </div>
                                )}
                                {processedLockers.map((locker: any) => (
                                  <SelectItem key={locker.id} value={locker.id}>
                                    <div>
                                      <div className="font-medium">{locker.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {locker.city}, {locker.province}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate max-w-80">
                                        {locker.address}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </>
                            ) : lockerSearchTerm ? (
                              <SelectItem value="no-results" disabled>
                                No lockers found matching "{lockerSearchTerm}"
                              </SelectItem>
                            ) : (
                              <SelectItem value="loading-lockers" disabled>
                                Loading locker locations...
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-1">
                          Default Pudo locker for your shipments. {city && 'Lockers in your city are shown first. '}
                          Customers can still choose a different locker at checkout.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      // Build collection address from individual fields
                      const collectionAddress = streetAddress || suburb || city || postalCode 
                        ? JSON.stringify({
                            streetAddress: streetAddress.trim(),
                            suburb: suburb.trim(),
                            city: city.trim(),
                            postalCode: postalCode.trim()
                          })
                        : undefined;
                      
                      updateDeliveryMutation.mutate({
                        deliveryOptions,
                        pudoCollectionAddress: collectionAddress,
                        pudoPreferredLocker: pudoPreferredLocker || undefined,
                      });
                    }}
                    disabled={updateDeliveryMutation.isPending}
                  >
                    {updateDeliveryMutation.isPending ? "Saving..." : "Save Delivery Settings"}
                  </Button>
                </div>
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

// Products Management Component
function ProductsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/vendor/products"],
  });

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let filtered = products;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = products.filter((product: any) =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === "price") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [products, searchTerm, sortBy, sortOrder]);

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest(`/api/vendor/products/${productId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `R ${(numPrice || 0).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <p className="text-muted-foreground">
            Manage your product catalog and view performance analytics
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-brand hover:bg-primary-brand/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary-brand" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">
                  {products.filter((p: any) => p.stock > 0).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">
                  {products.filter((p: any) => p.stock === 0).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">
                  {products.length > 0 
                    ? formatPrice(products.reduce((sum: number, p: any) => sum + (parseFloat(p.price) || 0), 0) / products.length)
                    : "R 0.00"
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="createdAt">Date Added</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-muted-foreground">
                {searchTerm.trim() 
                  ? "Try adjusting your search terms" 
                  : "Get started by adding your first product"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Stock</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product: any) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{formatPrice(parseFloat(product.price) || 0)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock > 10 
                            ? "bg-green-100 text-green-800" 
                            : product.stock > 0 
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock > 0 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {product.stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <ProductFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          product={null}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && selectedProduct && (
        <ProductFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Delete Product</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{selectedProduct.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteProductMutation.mutate(selectedProduct.id)}
                disabled={deleteProductMutation.isPending}
              >
                {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Product Form Modal Component
function ProductFormModal({ 
  isOpen, 
  onClose, 
  product, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: any; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    stock: product?.stock || "",
    pudoWeight: product?.pudoWeight || "",
    pudoDimensions: product?.pudoDimensions || { length: "", width: "", height: "" }
  });

  const { toast } = useToast();

  const isEditing = Boolean(product);

  // Create/Update product mutation
  const productMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isEditing 
        ? `/api/vendor/products/${product.id}` 
        : "/api/vendor/products";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await apiRequest(endpoint, method, {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        pudoWeight: parseFloat(data.pudoWeight),
        pudoDimensions: {
          length: parseFloat(data.pudoDimensions.length),
          width: parseFloat(data.pudoDimensions.width),
          height: parseFloat(data.pudoDimensions.height)
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Product ${isEditing ? "updated" : "created"} successfully`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} product`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    productMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("pudoDimensions.")) {
      const dimensionField = field.split(".")[1];
      setFormData(prev => ({
        ...prev,
        pudoDimensions: {
          ...prev.pudoDimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit Product" : "Add New Product"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (ZAR)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="pudoWeight">Weight (kg)</Label>
              <Input
                id="pudoWeight"
                type="number"
                step="0.1"
                value={formData.pudoWeight}
                onChange={(e) => handleInputChange("pudoWeight", e.target.value)}
                placeholder="0.0"
                required
              />
            </div>
          </div>

          <div>
            <Label>Dimensions (cm) for Pudo Shipping</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <div>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.pudoDimensions.length}
                  onChange={(e) => handleInputChange("pudoDimensions.length", e.target.value)}
                  placeholder="Length"
                  required
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.pudoDimensions.width}
                  onChange={(e) => handleInputChange("pudoDimensions.width", e.target.value)}
                  placeholder="Width"
                  required
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.pudoDimensions.height}
                  onChange={(e) => handleInputChange("pudoDimensions.height", e.target.value)}
                  placeholder="Height"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={productMutation.isPending}
              className="bg-primary-brand hover:bg-primary-brand/90"
            >
              {productMutation.isPending 
                ? (isEditing ? "Updating..." : "Creating...") 
                : (isEditing ? "Update Product" : "Create Product")
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}