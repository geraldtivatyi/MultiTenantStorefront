import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, User, MapPin, Bell, Shield, Save, Trash2, Plus, Mail, CheckCircle, XCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  type: z.string().default("shipping"),
  isDefault: z.boolean().default(false),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AddressFormData = z.infer<typeof addressSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function AccountSettings() {
  const [activeTab, setActiveTab] = useState<"profile" | "address" | "password" | "preferences">("profile");
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  // Fetch user addresses
  const { data: addresses = [] } = useQuery<any[]>({
    queryKey: ['/api/account/addresses'],
    enabled: isAuthenticated,
  });

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['/api/account/preferences'],
    enabled: isAuthenticated,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  // Update profile form when user data is available
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
  }, [user, profileForm]);

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "South Africa",
      type: "shipping",
      isDefault: false,
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("/api/account/profile", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      return apiRequest("/api/account/password", "PUT", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please check your current password.",
        variant: "destructive",
      });
    },
  });

  // Address mutations
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      return apiRequest("/api/account/addresses", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Address added",
        description: "Your address has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/account/addresses'] });
      addressForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AddressFormData }) => {
      return apiRequest(`/api/account/addresses/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Address updated",
        description: "Your address has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/account/addresses'] });
      setSelectedAddress(null);
      addressForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update address. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/account/addresses/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Address deleted",
        description: "Your address has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/account/addresses'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Preferences mutation
  const preferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/account/preferences", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/account/preferences'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/resend-verification", "POST", {});
    },
    onSuccess: () => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    profileMutation.mutate(data);
  };

  const onAddressSubmit = (data: AddressFormData) => {
    if (selectedAddress) {
      updateAddressMutation.mutate({ id: selectedAddress.id, data });
    } else {
      createAddressMutation.mutate(data);
    }
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    passwordMutation.mutate(data);
  };

  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "address", label: "Address", icon: MapPin },
    { id: "password", label: "Password", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account information and preferences</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary-brand text-white'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <div className="flex items-center gap-2">
                          <Input type="email" value={user?.email || ""} disabled className="bg-muted flex-1" />
                          {user?.emailVerified ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                        {!user?.emailVerified && (
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <Mail className="h-4 w-4 text-yellow-600" />
                            <div className="flex-1">
                              <p className="text-sm text-yellow-800 font-medium">Email not verified</p>
                              <p className="text-xs text-yellow-700">Please verify your email to access all features</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => resendVerificationMutation.mutate()}
                              disabled={resendVerificationMutation.isPending}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              {resendVerificationMutation.isPending ? "Sending..." : "Resend"}
                            </Button>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">Contact support to change your email address</p>
                      </div>
                      
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full md:w-auto" 
                        disabled={profileMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {profileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "address" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Shipping Addresses</CardTitle>
                    <Button 
                      onClick={() => {
                        setSelectedAddress(null);
                        addressForm.reset();
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No addresses saved yet</p>
                        <p className="text-sm text-muted-foreground">Add your first address to get started</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {addresses.map((address: any) => (
                          <div key={address.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{address.type}</span>
                                  {address.isDefault && (
                                    <span className="bg-primary-brand text-white px-2 py-1 rounded text-xs">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm">{address.street}</p>
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state} {address.postalCode}
                                </p>
                                <p className="text-sm text-muted-foreground">{address.country}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAddress(address);
                                    addressForm.reset(address);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteAddressMutation.mutate(address.id)}
                                  disabled={deleteAddressMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {(selectedAddress || addresses.length === 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {selectedAddress ? "Edit Address" : "Add New Address"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...addressForm}>
                        <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-6">
                          <FormField
                            control={addressForm.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street Address</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter your street address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                              control={addressForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="City" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={addressForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State/Province</FormLabel>
                                  <FormControl>
                                    <Input placeholder="State" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                              control={addressForm.control}
                              name="postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Postal Code" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={addressForm.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Country" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={addressForm.control}
                            name="isDefault"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Set as default address
                                  </FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Use this address as your default shipping address
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-4">
                            <Button 
                              type="submit" 
                              disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {(createAddressMutation.isPending || updateAddressMutation.isPending) ? "Saving..." : 
                               selectedAddress ? "Update Address" : "Save Address"}
                            </Button>
                            {selectedAddress && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAddress(null);
                                  addressForm.reset();
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "password" && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={passwordMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {passwordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "preferences" && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                        </div>
                        <Switch 
                          checked={preferences?.emailOrderUpdates ?? true}
                          onCheckedChange={(checked) => 
                            preferencesMutation.mutate({ emailOrderUpdates: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <p className="font-medium">Marketing Emails</p>
                          <p className="text-sm text-muted-foreground">Receive promotions and new product announcements</p>
                        </div>
                        <Switch 
                          checked={preferences?.emailMarketing ?? false}
                          onCheckedChange={(checked) => 
                            preferencesMutation.mutate({ emailMarketing: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <p className="font-medium">Account Security</p>
                          <p className="text-sm text-muted-foreground">Important security notifications (always enabled)</p>
                        </div>
                        <Switch checked={true} disabled />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <p className="font-medium">Profile Visibility</p>
                          <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                        </div>
                        <Switch 
                          checked={preferences?.profileVisible ?? false}
                          onCheckedChange={(checked) => 
                            preferencesMutation.mutate({ profileVisible: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <p className="font-medium">Analytics Collection</p>
                          <p className="text-sm text-muted-foreground">Allow collection of usage analytics to improve our service</p>
                        </div>
                        <Switch 
                          checked={preferences?.allowAnalytics ?? true}
                          onCheckedChange={(checked) => 
                            preferencesMutation.mutate({ allowAnalytics: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {preferencesMutation.isPending && (
                    <div className="flex items-center justify-center py-4">
                      <div className="text-sm text-muted-foreground">Saving preferences...</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}