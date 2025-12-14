import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Send,
  Trash2,
  RotateCw,
  Package,
  Search,
  Filter,
  Edit,
  Eye,
  Plus,
  Upload,
  X,
  AlertCircle
} from "lucide-react";
import { StatsGridSkeleton, TableSkeleton, FormSkeleton } from "@/components/skeletons";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function StoreSettingsTab() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    heroTitle: "",
    heroSubtitle: "",
    heroImageUrl: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    whatsappPhone: "",
    deliveryOptions: ["collection", "pudo"] as string[],
    pudoCollectionAddress: null as any,
    pudoPreferredLocker: "",
    aboutStory: "",
    aboutValues: [] as Array<{ title: string; description: string; icon?: string }>,
    aboutStats: null as any,
    aboutImages: [] as string[],
    storeHours: {} as any,
  });

  // Fetch store settings
  const { data: storeSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/admin/store-settings"],
  });

  // Update form data when settings load
  useEffect(() => {
    if (storeSettings) {
      setFormData({
        name: storeSettings.name || "",
        description: storeSettings.description || "",
        address: storeSettings.address || "",
        heroTitle: storeSettings.heroTitle || "",
        heroSubtitle: storeSettings.heroSubtitle || "",
        heroImageUrl: storeSettings.heroImageUrl || "",
        contactEmail: storeSettings.contactEmail || "",
        contactPhone: storeSettings.contactPhone || "",
        contactAddress: storeSettings.contactAddress || "",
        whatsappPhone: storeSettings.whatsappPhone || "",
        deliveryOptions: storeSettings.deliveryOptions || ["collection", "pudo"],
        pudoCollectionAddress: storeSettings.pudoCollectionAddress || null,
        pudoPreferredLocker: storeSettings.pudoPreferredLocker || "",
        aboutStory: storeSettings.aboutStory || "",
        aboutValues: (storeSettings.aboutValues as any) || [],
        aboutStats: storeSettings.aboutStats || null,
        aboutImages: (storeSettings.aboutImages as any) || [],
        storeHours: storeSettings.storeHours || {},
      });
    }
  }, [storeSettings]);

  // Update store settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/admin/store-settings", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Store settings have been updated successfully!",
      });
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update store settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Store Settings</h2>
        <p className="text-muted-foreground">
          Configure your store's information, branding, and content.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your Store Name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your store"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Store address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+27 XX XXX XXXX"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="whatsappPhone">WhatsApp Phone (for notifications)</Label>
              <Input
                id="whatsappPhone"
                value={formData.whatsappPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                placeholder="+27 XX XXX XXXX"
              />
            </div>

            <div>
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                value={formData.heroTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
                placeholder="Welcome to M Blessings"
              />
            </div>

            <div>
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Input
                id="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                placeholder="Discover trendy clothing and style essentials"
              />
            </div>

            <div>
              <Label htmlFor="heroImageUrl">Hero Image URL</Label>
              <Input
                id="heroImageUrl"
                value={formData.heroImageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* About Page Settings */}
      <Card>
        <CardHeader>
          <CardTitle>About Page Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="aboutStory">About Story</Label>
              <Textarea
                id="aboutStory"
                value={formData.aboutStory}
                onChange={(e) => setFormData(prev => ({ ...prev, aboutStory: e.target.value }))}
                placeholder="Tell your store's story..."
                rows={6}
              />
            </div>

            <div>
              <Label>About Images (URLs, one per line)</Label>
              <Textarea
                value={formData.aboutImages.join('\n')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  aboutImages: e.target.value.split('\n').filter(url => url.trim()) 
                }))}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save About Page"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pudoPreferredLocker">Preferred Pudo Locker ID</Label>
              <Input
                id="pudoPreferredLocker"
                value={formData.pudoPreferredLocker}
                onChange={(e) => setFormData(prev => ({ ...prev, pudoPreferredLocker: e.target.value }))}
                placeholder="Enter preferred locker ID"
              />
            </div>

            <div>
              <Label>Pudo Collection Address (JSON)</Label>
              <Textarea
                value={formData.pudoCollectionAddress ? JSON.stringify(formData.pudoCollectionAddress, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                    setFormData(prev => ({ ...prev, pudoCollectionAddress: parsed }));
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='{"street": "123 Main St", "city": "Cape Town", "code": "8001", "lat": "-33.9249", "lng": "18.4241"}'
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a valid JSON object with street, city, code, lat, and lng fields
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Delivery Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Store Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Store Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const dayLower = day.toLowerCase();
              const hours = formData.storeHours?.[dayLower] || { open: '', close: '', closed: false };
              return (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24">
                    <Label>{day}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          storeHours: {
                            ...prev.storeHours,
                            [dayLower]: { ...hours, closed: !e.target.checked }
                          }
                        }));
                      }}
                    />
                    <Label className="text-sm">Open</Label>
                  </div>
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.open || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            storeHours: {
                              ...prev.storeHours,
                              [dayLower]: { ...hours, open: e.target.value }
                            }
                          }));
                        }}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hours.close || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            storeHours: {
                              ...prev.storeHours,
                              [dayLower]: { ...hours, close: e.target.value }
                            }
                          }));
                        }}
                        className="w-32"
                      />
                    </>
                  )}
                  {hours.closed && (
                    <span className="text-muted-foreground text-sm">Closed</span>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Store Hours"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

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

// Product Form Component - Extracted to prevent re-creation on every render
interface ProductFormProps {
  productForm: {
    name: string;
    description: string;
    price: string;
    stock: string;
    category: string;
    pudoWeight: string;
    pudoLength: string;
    pudoWidth: string;
    pudoHeight: string;
    imageUrl: string;
    isActive: boolean;
  };
  editingProduct: any;
  uploadingImage: boolean;
  isPending: boolean;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStockChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCategoryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPudoWeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPudoLengthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPudoWidthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPudoHeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onImageUpload: (file: File) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const ProductFormComponent = React.memo(function ProductFormComponent({
  productForm,
  editingProduct,
  uploadingImage,
  isPending,
  onNameChange,
  onDescriptionChange,
  onPriceChange,
  onStockChange,
  onCategoryChange,
  onPudoWeightChange,
  onPudoLengthChange,
  onPudoWidthChange,
  onPudoHeightChange,
  onImageUrlChange,
  onRemoveImage,
  onImageUpload,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={productForm.name}
          onChange={onNameChange}
          placeholder="Enter product name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={productForm.description}
          onChange={onDescriptionChange}
          placeholder="Enter product description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (R) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={productForm.price}
            onChange={onPriceChange}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            value={productForm.stock}
            onChange={onStockChange}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={productForm.category}
          onChange={onCategoryChange}
          placeholder="e.g., T-Shirts, Dresses, Jeans"
        />
      </div>

      <div>
        <Label htmlFor="pudoWeight">Weight (kg) *</Label>
        <Input
          id="pudoWeight"
          type="number"
          step="0.01"
          value={productForm.pudoWeight}
          onChange={onPudoWeightChange}
          placeholder="0.5"
          required
        />
      </div>

      <div>
        <Label>Dimensions (cm) *</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="pudoLength" className="text-xs">Length</Label>
            <Input
              id="pudoLength"
              type="number"
              value={productForm.pudoLength}
              onChange={onPudoLengthChange}
              placeholder="30"
            />
          </div>
          <div>
            <Label htmlFor="pudoWidth" className="text-xs">Width</Label>
            <Input
              id="pudoWidth"
              type="number"
              value={productForm.pudoWidth}
              onChange={onPudoWidthChange}
              placeholder="30"
            />
          </div>
          <div>
            <Label htmlFor="pudoHeight" className="text-xs">Height</Label>
            <Input
              id="pudoHeight"
              type="number"
              value={productForm.pudoHeight}
              onChange={onPudoHeightChange}
              placeholder="15"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="imageUrl">Product Image</Label>
        <div className="space-y-2">
          {productForm.imageUrl && (
            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
              <img src={productForm.imageUrl} alt="Product" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <Upload className="h-4 w-4 mr-2" />
              {uploadingImage ? "Uploading..." : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file);
                }}
                disabled={uploadingImage}
              />
            </label>
            <Input
              id="imageUrl"
              value={productForm.imageUrl}
              onChange={onImageUrlChange}
              placeholder="Or enter image URL"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || uploadingImage}
        >
          {isPending
            ? "Saving..."
            : editingProduct
            ? "Update Product"
            : "Create Product"}
        </Button>
      </DialogFooter>
    </form>
  );
});

function ProductsTab() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch all products
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/products"],
  });

  // Filter and process products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p: any) => p.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((p: any) => p.isActive && p.stock > 0);
      } else if (statusFilter === "out_of_stock") {
        filtered = filtered.filter((p: any) => p.stock === 0);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((p: any) => !p.isActive);
      }
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p: any) => p.isActive && p.stock > 0).length;
    const outOfStock = products.filter((p: any) => p.stock === 0).length;
    return { total, active, outOfStock };
  }, [products]);

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `R ${(numPrice || 0).toFixed(2)}`;
  };

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    pudoWeight: "",
    pudoLength: "",
    pudoWidth: "",
    pudoHeight: "",
    imageUrl: "",
    isActive: true,
  });

  // Reset form - memoized to prevent re-creation
  const resetForm = useCallback(() => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      pudoWeight: "",
      pudoLength: "",
      pudoWidth: "",
      pudoHeight: "",
      imageUrl: "",
      isActive: true,
    });
    setEditingProduct(null);
  }, []);

  // Handle edit button click
  const handleEditClick = (product: any) => {
    const dimensions = product.pudoDimensions ? (typeof product.pudoDimensions === 'string' ? JSON.parse(product.pudoDimensions) : product.pudoDimensions) : { length: 30, width: 30, height: 15 };
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      stock: product.stock?.toString() || "0",
      category: product.category || "",
      pudoWeight: product.pudoWeight?.toString() || "",
      pudoLength: dimensions.length?.toString() || "30",
      pudoWidth: dimensions.width?.toString() || "30",
      pudoHeight: dimensions.height?.toString() || "15",
      imageUrl: product.imageUrl || "",
      isActive: product.isActive !== false,
    });
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (productId: number) => {
    setDeleteProductId(productId);
    setIsDeleteDialogOpen(true);
  };

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const response = await apiRequest("/api/admin/products/upload-image", "POST", {
            imageBase64: base64String,
          });
          const data = await response.json();
          setProductForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
          toast({
            title: "Image Uploaded",
            description: "Product image uploaded successfully!",
          });
        } catch (error) {
          toast({
            title: "Upload Failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingImage(false);
      toast({
        title: "Upload Failed",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/admin/products", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Product Created",
        description: "Product has been created successfully!",
      });
      resetForm();
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/admin/products/${editingProduct?.id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully!",
      });
      resetForm();
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/admin/products/${productId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product has been deactivated successfully!",
      });
      setIsDeleteDialogOpen(false);
      setDeleteProductId(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submit - memoized to prevent re-creation
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.price || !productForm.stock || !productForm.pudoWeight) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const pudoDimensions = {
      length: parseFloat(productForm.pudoLength) || 30,
      width: parseFloat(productForm.pudoWidth) || 30,
      height: parseFloat(productForm.pudoHeight) || 15,
    };

    const productData = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      category: productForm.category || null,
      pudoWeight: parseFloat(productForm.pudoWeight),
      pudoDimensions: pudoDimensions,
      imageUrl: productForm.imageUrl || null,
    };

    if (editingProduct) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  }, [productForm, editingProduct, toast, updateProductMutation, createProductMutation]);

  // Product form component - memoized handlers to prevent re-creation
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, name: e.target.value }));
  }, []);
  
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProductForm(prev => ({ ...prev, description: e.target.value }));
  }, []);
  
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, price: e.target.value }));
  }, []);
  
  const handleStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, stock: e.target.value }));
  }, []);
  
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, category: e.target.value }));
  }, []);
  
  const handlePudoWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, pudoWeight: e.target.value }));
  }, []);
  
  const handlePudoLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, pudoLength: e.target.value }));
  }, []);
  
  const handlePudoWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, pudoWidth: e.target.value }));
  }, []);
  
  const handlePudoHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, pudoHeight: e.target.value }));
  }, []);
  
  const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm(prev => ({ ...prev, imageUrl: e.target.value }));
  }, []);
  
  const handleRemoveImage = useCallback(() => {
    setProductForm(prev => ({ ...prev, imageUrl: "" }));
  }, []);
  
  const handleCancel = useCallback(() => {
    resetForm();
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
  }, [resetForm, setIsCreateDialogOpen, setIsEditDialogOpen]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Management</h2>
          <p className="text-muted-foreground">
            View and manage all products.
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold">{stats.active}</p>
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
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No products have been created yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Category</th>
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
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{product.category || "Uncategorized"}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{formatPrice(product.price)}</span>
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
                          product.isActive && product.stock > 0
                            ? "bg-green-100 text-green-800" 
                            : !product.isActive
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {product.isActive && product.stock > 0 ? "Active" : !product.isActive ? "Inactive" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your store. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          <ProductFormComponent
            productForm={productForm}
            editingProduct={editingProduct}
            uploadingImage={uploadingImage}
            isPending={createProductMutation.isPending || updateProductMutation.isPending}
            onNameChange={handleNameChange}
            onDescriptionChange={handleDescriptionChange}
            onPriceChange={handlePriceChange}
            onStockChange={handleStockChange}
            onCategoryChange={handleCategoryChange}
            onPudoWeightChange={handlePudoWeightChange}
            onPudoLengthChange={handlePudoLengthChange}
            onPudoWidthChange={handlePudoWidthChange}
            onPudoHeightChange={handlePudoHeightChange}
            onImageUrlChange={handleImageUrlChange}
            onRemoveImage={handleRemoveImage}
            onImageUpload={handleImageUpload}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information. All changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <ProductFormComponent
            productForm={productForm}
            editingProduct={editingProduct}
            uploadingImage={uploadingImage}
            isPending={createProductMutation.isPending || updateProductMutation.isPending}
            onNameChange={handleNameChange}
            onDescriptionChange={handleDescriptionChange}
            onPriceChange={handlePriceChange}
            onStockChange={handleStockChange}
            onCategoryChange={handleCategoryChange}
            onPudoWeightChange={handlePudoWeightChange}
            onPudoLengthChange={handlePudoLengthChange}
            onPudoWidthChange={handlePudoWidthChange}
            onPudoHeightChange={handlePudoHeightChange}
            onImageUrlChange={handleImageUrlChange}
            onRemoveImage={handleRemoveImage}
            onImageUpload={handleImageUpload}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this product? This will set its stock to 0 and make it unavailable for purchase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProductId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteProductId) {
                  deleteProductMutation.mutate(deleteProductId);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrdersTab() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  // Fetch all orders
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  // Fetch order items for selected order
  const { data: orderItems = [] } = useQuery({
    queryKey: ["/api/orders", selectedOrder, "items"],
    enabled: selectedOrder !== null,
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((o: any) => o.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((o: any) =>
        o.orderNumber?.toLowerCase().includes(query) ||
        o.customerEmail?.toLowerCase().includes(query) ||
        o.customerName?.toLowerCase().includes(query) ||
        o.customerPhone?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, searchTerm, statusFilter]);

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return await apiRequest(`/api/admin/orders/${orderId}/update-status`, "PUT", { status });
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully!",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `R ${(numPrice || 0).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Order Management</h2>
          <p className="text-muted-foreground">
            View and manage all customer orders.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, customer name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No orders have been placed yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium">Order #</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium">#{order.orderNumber}</div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                          {order.customerPhone && (
                            <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{formatPrice(order.total)}</span>
                      </td>
                      <td className="p-4">
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => {
                            updateOrderStatusMutation.mutate({ orderId: order.id, status: newStatus });
                          }}
                        >
                          <SelectTrigger className={`w-32 ${getStatusColor(order.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {selectedOrder === order.id ? "Hide" : "View"} Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={selectedOrder !== null} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                View detailed information about this order including customer details, items, and shipping information.
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const order = orders.find((o: any) => o.id === selectedOrder);
              if (!order) return null;
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                      <p className="font-semibold">#{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                      <p>{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Customer Email</p>
                      <p>{order.customerEmail}</p>
                    </div>
                    {order.customerPhone && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Customer Phone</p>
                        <p>{order.customerPhone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                      <p className="font-semibold text-lg">{formatPrice(order.total)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Shipping Address</p>
                    <p>{order.shippingAddress}</p>
                    <p>{order.city}, {order.postalCode}</p>
                    {order.deliveryMethod === "pudo" && order.pudoLocker && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Delivery: Pudo Locker ({order.pudoLocker})
                      </p>
                    )}
                    {order.pudoTrackingReference && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Tracking: {order.pudoTrackingReference}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
                    {orderItems.length > 0 ? (
                      <div className="space-y-2">
                        {orderItems.map((item: any) => (
                          <div key={item.id} className="flex justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{item.product?.name || item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} × {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="font-medium">
                              {formatPrice(item.quantity * parseFloat(item.price))}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Loading items...</p>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    {parseFloat(order.shippingCost) > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium">Shipping</span>
                        <span>{formatPrice(order.shippingCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PaymentsTab() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch payment stats
  const { data: paymentStats } = useQuery({
    queryKey: ["/api/admin/payment-stats"],
  });

  // Fetch all payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/admin/payments"],
  });

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p: any) => p.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.orderNumber?.toLowerCase().includes(query) ||
        p.customerEmail?.toLowerCase().includes(query) ||
        p.customerName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [payments, searchTerm, statusFilter]);

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `R ${(numPrice || 0).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Management</h2>
          <p className="text-muted-foreground">
            Monitor all payment transactions.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{(paymentStats as any)?.totalRevenue || "R 0.00"}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{(paymentStats as any)?.totalTransactions || 0}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">{(paymentStats as any)?.pendingPayments || 0}</p>
                </div>
                <CreditCard className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">{(paymentStats as any)?.todaysRevenue || "R 0.00"}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No payment transactions yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium">Order Number</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment: any) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium">#{payment.orderNumber}</div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{payment.customerName || "Guest"}</p>
                          <p className="text-sm text-muted-foreground">{payment.customerEmail}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{formatPrice(payment.total)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{formatDate(payment.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "store-settings" | "products" | "orders" | "payments" | "settings">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: activeTab === "dashboard",
  });

  // Fetch orders for charts
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/admin/orders"],
    enabled: activeTab === "dashboard",
  });

  // Fetch products for low stock alerts
  const { data: products = [] } = useQuery({
    queryKey: ["/api/admin/products"],
    enabled: activeTab === "dashboard",
  });

  // Calculate chart data
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        revenueData: [],
        orderStatusData: [],
        topProducts: [],
      };
    }

    // Revenue over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = (orders as any[]).filter((o: any) => new Date(o.createdAt) >= thirtyDaysAgo);
    
    const revenueByDate: { [key: string]: number } = {};
    recentOrders.forEach((order: any) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
        revenueByDate[date] += parseFloat(order.total);
      }
    });
    const revenueData = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Orders by status
    const statusCounts: { [key: string]: number } = {};
    (orders as any[]).forEach((order: any) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    const orderStatusData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    return {
      revenueData,
      orderStatusData,
      topProducts: [], // Will be populated if we have order items
    };
  }, [orders]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <h1 className="text-lg lg:text-xl font-bold text-primary-brand">Platform Admin</h1>
        <p className="text-xs lg:text-sm text-muted-foreground">Admin Dashboard</p>
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
            onClick={() => handleTabChange("store-settings")}
            className={`w-full text-left flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "store-settings"
                ? "bg-primary-brand text-white"
                : "text-muted-foreground hover:bg-gray-100"
            }`}
          >
            <Store className="mr-3 h-4 w-4" />
            Store Settings
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
                    {activeTab === "store-settings" && "Store Settings"}
                    {activeTab === "products" && "Product Management"}
                    {activeTab === "orders" && "Order Management"}
                    {activeTab === "payments" && "Payment Management"}
                    {activeTab === "settings" && "Platform Settings"}
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {activeTab === "dashboard" && "Welcome back! Here's what's happening across your platform."}
                    {activeTab === "store-settings" && "Configure your store's information and branding."}
                    {activeTab === "products" && "Create and manage products."}
                    {activeTab === "orders" && "View and manage customer orders."}
                    {activeTab === "payments" && "Monitor payments and transactions."}
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
                {statsLoading ? (
                  <div className="text-center py-8">
                    <StatsGridSkeleton />
                  </div>
                ) : statsError ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Failed to load dashboard statistics. Please try again.</p>
                  </div>
                ) : dashboardStats ? (
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
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Products</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(dashboardStats as any)?.totalProducts || 0}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              Products in store
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
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center">
                            <div className="bg-primary-brand/10 rounded-full p-2 sm:p-3">
                              <Package className="text-primary-brand h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Orders</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(dashboardStats as any)?.totalOrders || 0}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              All orders
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center">
                            <div className="bg-secondary-brand/10 rounded-full p-2 sm:p-3">
                              <Users className="text-secondary-brand h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Users</p>
                              <p className="text-xl sm:text-2xl font-bold text-foreground">{(dashboardStats as any)?.activeUsers || 0}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              Active in last 90 days
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Low Stock Alerts */}
                    {(() => {
                      const lowStockProducts = products.filter((p: any) => 
                        p.stock !== null && p.stock > 0 && p.stock < 10
                      );
                      if (lowStockProducts.length > 0) {
                        return (
                          <Card className="mt-6 border-orange-200 bg-orange-50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-orange-800">
                                <AlertCircle className="h-5 w-5" />
                                Low Stock Alert
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-orange-700 mb-3">
                                {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} {lowStockProducts.length === 1 ? 'is' : 'are'} running low on stock:
                              </p>
                              <div className="space-y-2">
                                {lowStockProducts.slice(0, 5).map((product: any) => (
                                  <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded border border-orange-200">
                                    <span className="text-sm font-medium">{product.name}</span>
                                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                                      {product.stock} left
                                    </Badge>
                                  </div>
                                ))}
                                {lowStockProducts.length > 5 && (
                                  <p className="text-xs text-orange-600 mt-2">
                                    +{lowStockProducts.length - 5} more product{lowStockProducts.length - 5 !== 1 ? 's' : ''} with low stock
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      return null;
                    })()}

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                      {/* Revenue Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {chartData.revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={chartData.revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `R ${value}`} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue (R)" />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                              No revenue data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Orders by Status Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Orders by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {chartData.orderStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={chartData.orderStatusData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {chartData.orderStatusData.map((entry, index) => {
                                    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                  })}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                              No order data available
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No dashboard data available.</p>
                  </div>
                )}
              </>
            )}

            {/* Other Tab Content */}
            {activeTab === "store-settings" && (
              <StoreSettingsTab />
            )}

            {activeTab === "products" && (
              <ProductsTab />
            )}

            {activeTab === "payments" && (
              <PaymentsTab />
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