import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { 
  BarChart3, 
  Store, 
  Users, 
  CreditCard, 
  Settings, 
  Plus, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  TrendingUp
} from "lucide-react";
import type { Tenant, Product } from "@shared/schema";

// Form schemas
const tenantSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  ownerEmail: z.string().email("Please enter a valid email address"),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
});

const productSchema = z.object({
  tenantId: z.number(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  longDescription: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  category: z.string().optional(),
  stock: z.number().min(0, "Stock cannot be negative").optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tenants" | "products">("dashboard");
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenants
  const { data: tenants = [], isLoading: tenantsLoading, error: tenantsError } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/tenants"],
  });

  // Mock stats for dashboard (in a real app, these would come from APIs)
  const stats = {
    totalTenants: tenants.length,
    totalRevenue: "₦1,240,000",
    totalOrders: 15847,
    activeUsers: 89432,
  };

  // Forms
  const tenantForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      ownerEmail: "",
      heroTitle: "",
      heroSubtitle: "",
    },
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      tenantId: selectedTenant || 0,
      name: "",
      description: "",
      longDescription: "",
      price: "",
      imageUrl: "",
      category: "",
      stock: 0,
    },
  });

  // Mutations
  const createTenantMutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const response = await apiRequest("POST", "/api/admin/tenants", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      tenantForm.reset();
      toast({
        title: "Tenant created",
        description: "New tenant has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create tenant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/admin/products", data);
      return response.json();
    },
    onSuccess: () => {
      productForm.reset();
      toast({
        title: "Product created",
        description: "New product has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onCreateTenant = (data: TenantFormData) => {
    createTenantMutation.mutate(data);
  };

  const onCreateProduct = (data: ProductFormData) => {
    if (!selectedTenant) {
      toast({
        title: "Error",
        description: "Please select a tenant first.",
        variant: "destructive",
      });
      return;
    }
    createProductMutation.mutate({ ...data, tenantId: selectedTenant });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="flex">
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-brand">Platform Admin</h1>
            <p className="text-sm text-muted-foreground">Multi-Tenant Dashboard</p>
          </div>
          <nav className="mt-6">
            <div className="space-y-1 px-3">
              <button
                onClick={() => setActiveTab("dashboard")}
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
                onClick={() => setActiveTab("tenants")}
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
                onClick={() => setActiveTab("products")}
                className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "products"
                    ? "bg-primary-brand text-white"
                    : "text-muted-foreground hover:bg-gray-100"
                }`}
              >
                <Users className="mr-3 h-4 w-4" />
                Products
              </button>
              <a
                href="#"
                className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="mr-3 h-4 w-4" />
                Payments
              </a>
              <a
                href="#"
                className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-gray-100 transition-colors"
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </a>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {activeTab === "dashboard" && "Dashboard Overview"}
                    {activeTab === "tenants" && "Tenant Management"}
                    {activeTab === "products" && "Product Management"}
                  </h2>
                  <p className="text-muted-foreground">
                    {activeTab === "dashboard" && "Welcome back! Here's what's happening across your platform."}
                    {activeTab === "tenants" && "Manage your tenant stores and configurations."}
                    {activeTab === "products" && "Create and manage products for your tenants."}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary-brand transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-1 inline" />
                    View Store
                  </a>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-primary-brand/10 rounded-full p-3">
                          <Store className="text-primary-brand h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                          <p className="text-2xl font-bold text-foreground">{stats.totalTenants}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-secondary-brand text-sm font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +12% from last month
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-secondary-brand/10 rounded-full p-3">
                          <CreditCard className="text-secondary-brand h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                          <p className="text-2xl font-bold text-foreground">{stats.totalRevenue}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-secondary-brand text-sm font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +8% from last month
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-accent-brand/10 rounded-full p-3">
                          <BarChart3 className="text-accent-brand h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                          <p className="text-2xl font-bold text-foreground">{stats.totalOrders.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-secondary-brand text-sm font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +15% from last month
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-error-brand/10 rounded-full p-3">
                          <Users className="text-error-brand h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                          <p className="text-2xl font-bold text-foreground">{stats.activeUsers.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-secondary-brand text-sm font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +22% from last month
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity & Payment Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Tenants */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Tenants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tenantsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                              <Skeleton className="h-6 w-16" />
                            </div>
                          ))}
                        </div>
                      ) : tenantsError ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>Failed to load tenants.</AlertDescription>
                        </Alert>
                      ) : tenants.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No tenants created yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {tenants.slice(0, 3).map((tenant) => (
                            <div key={tenant.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="bg-primary-brand/10 rounded-full p-2">
                                  <Store className="text-primary-brand h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">{tenant.name}</p>
                                  <p className="text-sm text-muted-foreground">{tenant.subdomain}.platform.com</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={tenant.isActive ? "default" : "secondary"} className="mb-1">
                                  {tenant.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "Recently"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-secondary-brand/10 rounded-full p-2">
                              <CheckCircle className="text-secondary-brand h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">Successful Payments</p>
                              <p className="text-sm text-muted-foreground">Last 30 days</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-secondary-brand">12,847</p>
                            <p className="text-sm text-muted-foreground">98.2%</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-error-brand/10 rounded-full p-2">
                              <XCircle className="text-error-brand h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">Failed Payments</p>
                              <p className="text-sm text-muted-foreground">Last 30 days</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-error-brand">234</p>
                            <p className="text-sm text-muted-foreground">1.8%</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-accent-brand/10 rounded-full p-2">
                              <Clock className="text-accent-brand h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">Pending Payouts</p>
                              <p className="text-sm text-muted-foreground">To tenants</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-accent-brand">₦45,230</p>
                            <p className="text-sm text-muted-foreground">23 tenants</p>
                          </div>
                        </div>
                      </div>

                      {/* Paystack Integration Status */}
                      <div className="mt-6 p-4 bg-secondary-brand/10 rounded-lg border border-secondary-brand/20">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-secondary-brand" />
                          <span className="font-medium text-secondary-brand">Paystack Integration Active</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">All webhooks verified and functioning</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Tenants Tab */}
            {activeTab === "tenants" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Create New Tenant */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Tenant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...tenantForm}>
                      <form onSubmit={tenantForm.handleSubmit(onCreateTenant)} className="space-y-4">
                        <FormField
                          control={tenantForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Name</FormLabel>
                              <FormControl>
                                <Input placeholder="My Store" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={tenantForm.control}
                          name="subdomain"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subdomain</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <Input placeholder="mystore" className="rounded-r-none" {...field} />
                                  <span className="bg-muted border border-l-0 border-input rounded-r-md px-3 py-2 text-muted-foreground">
                                    .platform.com
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={tenantForm.control}
                          name="ownerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Owner Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="owner@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={tenantForm.control}
                          name="heroTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hero Title (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Welcome to our store" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={tenantForm.control}
                          name="heroSubtitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hero Subtitle (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Discover amazing products" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-primary-brand hover:bg-primary-brand/90"
                          disabled={createTenantMutation.isPending}
                        >
                          {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Tenant List */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Tenants ({tenants.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tenantsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : tenantsError ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Failed to load tenants.</AlertDescription>
                      </Alert>
                    ) : tenants.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No tenants created yet.</p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {tenants.map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="bg-primary-brand/10 rounded-full p-2">
                                <Store className="text-primary-brand h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{tenant.name}</p>
                                <p className="text-sm text-muted-foreground">{tenant.subdomain}.platform.com</p>
                                <p className="text-xs text-muted-foreground">{tenant.ownerEmail}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={tenant.isActive ? "default" : "secondary"} className="mb-1">
                                {tenant.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "Recently"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="space-y-6">
                {/* Tenant Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Tenant Store</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tenants.map((tenant) => (
                        <div
                          key={tenant.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedTenant === tenant.id
                              ? "border-primary-brand bg-primary-brand/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedTenant(tenant.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary-brand/10 rounded-full p-2">
                              <Store className="text-primary-brand h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{tenant.name}</p>
                              <p className="text-sm text-muted-foreground">{tenant.subdomain}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selectedTenant && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Product for {tenants.find(t => t.id === selectedTenant)?.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...productForm}>
                        <form onSubmit={productForm.handleSubmit(onCreateProduct)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={productForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="MacBook Pro 16 inch" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (NGN)</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" placeholder="2499.99" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={productForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Short Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Brief product description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={productForm.control}
                            name="longDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Detailed Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Detailed product description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={productForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Electronics" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="stock"
                              render={({ field: { value, onChange, ...field } }) => (
                                <FormItem>
                                  <FormLabel>Stock Quantity</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="100" 
                                      value={value || ""} 
                                      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Image URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://example.com/image.jpg" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full bg-primary-brand hover:bg-primary-brand/90"
                            disabled={createProductMutation.isPending}
                          >
                            {createProductMutation.isPending ? "Creating Product..." : "Create Product"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
