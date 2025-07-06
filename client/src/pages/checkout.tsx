import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/hooks/use-cart";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateCartTotal, formatPrice } from "@/lib/utils";
import { paystackService } from "@/lib/paystack";
import { ArrowLeft, Lock, CreditCard, Banknote, Smartphone } from "lucide-react";

const checkoutSchema = z.object({
  customerEmail: z.string().email("Please enter a valid email address"),
  customerName: z.string().min(1, "Name is required"),
  shippingAddress: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  deliveryMethod: z.enum(["collection", "standard_delivery", "pudo"], {
    required_error: "Please select a delivery method",
  }),
  pudoLocker: z.string().optional(), // Required when delivery method is pudo
  paymentMethod: z.enum(["card", "bank", "ussd"], {
    required_error: "Please select a payment method",
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function Checkout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string>("collection");
  const [pudoLockers, setPudoLockers] = useState<any[]>([]);
  const [lockerSearchTerm, setLockerSearchTerm] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  
  const { cartItems, isLoading: cartLoading } = useCart();
  const { data: tenant } = useTenant();
  const { toast } = useToast();
  const { subtotal, tax, total } = calculateCartTotal(cartItems);
  
  // Calculate total with shipping
  const finalTotal = total + shippingCost;

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerEmail: "",
      customerName: "",
      shippingAddress: "",
      city: "",
      postalCode: "",
      deliveryMethod: "collection",
      pudoLocker: "",
      paymentMethod: "card",
    },
  });

  // Handle delivery method changes
  useEffect(() => {
    const deliveryMethod = form.watch("deliveryMethod");
    setSelectedDeliveryMethod(deliveryMethod);
    
    if (deliveryMethod === "pudo") {
      // Fetch Pudo lockers when Pudo is selected
      const fetchPudoLockers = async () => {
        try {
          const response = await apiRequest("/api/pudo/lockers", "GET");
          const data = await response.json();
          setPudoLockers(data);
        } catch (error) {
          console.error("Failed to fetch Pudo lockers:", error);
        }
      };
      fetchPudoLockers();
    }

    // Reset shipping cost when delivery method changes
    setShippingCost(0);
  }, [form.watch("deliveryMethod")]);

  // Process and sort lockers based on customer city and search term
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

    // Sort by proximity to customer's city
    const customerCity = form.watch("city")?.trim().toLowerCase();
    if (customerCity) {
      filteredLockers.sort((a: any, b: any) => {
        const aCity = a.city?.toLowerCase() || '';
        const bCity = b.city?.toLowerCase() || '';
        
        // Exact city match first
        const aExactMatch = aCity === customerCity;
        const bExactMatch = bCity === customerCity;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Partial city match second
        const aPartialMatch = aCity.includes(customerCity) || customerCity.includes(aCity);
        const bPartialMatch = bCity.includes(customerCity) || customerCity.includes(bCity);
        
        if (aPartialMatch && !bPartialMatch) return -1;
        if (!aPartialMatch && bPartialMatch) return 1;
        
        // Then sort alphabetically by name
        return (a.name || '').localeCompare(b.name || '');
      });
    } else {
      // If no customer city, just sort alphabetically by name
      filteredLockers.sort((a: any, b: any) => 
        (a.name || '').localeCompare(b.name || '')
      );
    }

    return filteredLockers;
  }, [pudoLockers, lockerSearchTerm, form.watch("city")]);

  // Calculate shipping when Pudo locker is selected
  useEffect(() => {
    const deliveryMethod = form.watch("deliveryMethod");
    const pudoLocker = form.watch("pudoLocker");
    
    if (deliveryMethod === "pudo" && pudoLocker && cartItems.length > 0) {
      const calculateShipping = async () => {
        setIsCalculatingShipping(true);
        try {
          const items = cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }));
          
          const response = await apiRequest("/api/pudo/calculate-shipping", "POST", {
            items,
            deliveryLocker: pudoLocker
          });
          const data = await response.json();
          setShippingCost(data.totalRate || 0);
        } catch (error) {
          console.error("Failed to calculate shipping:", error);
          setShippingCost(0);
        } finally {
          setIsCalculatingShipping(false);
        }
      };
      calculateShipping();
    } else if (deliveryMethod === "standard_delivery") {
      // Set a fixed rate for standard delivery
      setShippingCost(89.99);
    } else {
      setShippingCost(0);
    }
  }, [form.watch("pudoLocker"), cartItems]);

  const checkoutMutation = useMutation({
    mutationFn: async (data: Omit<CheckoutFormData, "paymentMethod">) => {
      const response = await apiRequest("POST", "/api/orders/checkout", data);
      return response.json();
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize Paystack service
      await paystackService.initialize();

      // Create order with delivery information
      const { paymentMethod, ...orderData } = data;
      const orderDataWithShipping = {
        ...orderData,
        shippingCost,
        totalAmount: finalTotal,
      };
      const result = await checkoutMutation.mutateAsync(orderDataWithShipping);

      // Process payment with Paystack
      await paystackService.makePayment({
        email: data.customerEmail,
        amount: finalTotal,
        reference: result.payment.reference,
        onSuccess: (response) => {
          toast({
            title: "Payment successful!",
            description: `Order ${result.order.orderNumber} has been confirmed.`,
          });
          // Redirect to success page or order confirmation
          window.location.href = "/";
        },
        onCancel: () => {
          toast({
            title: "Payment cancelled",
            description: "You can complete your payment later.",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0 && !cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Cart is empty</h2>
            <p className="text-muted-foreground mb-8">Add some products before checkout.</p>
            <Link href="/">
              <Button className="bg-primary-brand text-white hover:bg-primary-brand/90">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/cart">
            <Button variant="ghost" className="text-primary-brand hover:text-primary-brand/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Secure Checkout</h1>
          <div className="flex items-center text-sm text-muted-foreground">
            <Lock className="h-4 w-4 text-secondary-brand mr-1" />
            SSL Secured
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <div>
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center">
                <div className="flex items-center text-primary-brand">
                  <div className="bg-primary-brand text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">1</div>
                  <span className="ml-2 font-medium">Shipping</span>
                </div>
                <div className="flex-1 h-px bg-primary-brand mx-4"></div>
                <div className="flex items-center text-primary-brand">
                  <div className="bg-primary-brand text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">2</div>
                  <span className="ml-2 font-medium">Payment</span>
                </div>
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                <div className="flex items-center text-gray-400">
                  <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">3</div>
                  <span className="ml-2">Review</span>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Lagos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="100001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="deliveryMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-4"
                            >
                              {tenant?.deliveryOptions?.includes("collection") && (
                                <div className="flex items-center space-x-3 p-4 border border-primary-brand rounded-lg bg-primary-brand/5">
                                  <RadioGroupItem value="collection" id="collection" />
                                  <div className="flex-1">
                                    <label htmlFor="collection" className="font-medium cursor-pointer block">
                                      Collection - Free
                                    </label>
                                    <p className="text-sm text-muted-foreground">Collect from store</p>
                                  </div>
                                  <span className="text-sm font-semibold text-secondary-brand">R0.00</span>
                                </div>
                              )}
                              
                              {tenant?.deliveryOptions?.includes("standard_delivery") && (
                                <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg">
                                  <RadioGroupItem value="standard_delivery" id="standard_delivery" />
                                  <div className="flex-1">
                                    <label htmlFor="standard_delivery" className="font-medium cursor-pointer block">
                                      Standard Delivery
                                    </label>
                                    <p className="text-sm text-muted-foreground">Direct to your address</p>
                                  </div>
                                  <span className="text-sm font-semibold text-secondary-brand">R89.99</span>
                                </div>
                              )}

                              {tenant?.deliveryOptions?.includes("pudo") && (
                                <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg">
                                  <RadioGroupItem value="pudo" id="pudo" />
                                  <div className="flex-1">
                                    <label htmlFor="pudo" className="font-medium cursor-pointer block">
                                      Pudo Locker Delivery
                                    </label>
                                    <p className="text-sm text-muted-foreground">Via Courier Guy lockers</p>
                                  </div>
                                  <span className="text-sm font-semibold text-secondary-brand">
                                    {isCalculatingShipping ? "Calculating..." : formatPrice(shippingCost)}
                                  </span>
                                </div>
                              )}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Pudo Locker Selection */}
                    {selectedDeliveryMethod === "pudo" && (
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name="pudoLocker"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Pudo Locker</FormLabel>
                              
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

                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a locker location" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-80">
                                    {processedLockers.length > 0 ? (
                                      <>
                                        {form.watch("city") && !lockerSearchTerm && (
                                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                                            Lockers in {form.watch("city")} shown first
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
                              </FormControl>
                              <FormMessage />
                              
                              {form.watch("city") && !lockerSearchTerm && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Lockers in your city are shown first. Use the search to find specific locations.
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Payment Information</CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Powered by</span>
                        <span className="font-bold text-secondary-brand">Paystack</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-4"
                            >
                              <div className="flex items-center space-x-3 p-4 border border-primary-brand rounded-lg bg-primary-brand/5">
                                <RadioGroupItem value="card" id="card" />
                                <label htmlFor="card" className="font-medium cursor-pointer flex-1">
                                  Credit/Debit Card
                                </label>
                                <div className="flex space-x-2">
                                  <CreditCard className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg">
                                <RadioGroupItem value="bank" id="bank" />
                                <label htmlFor="bank" className="font-medium cursor-pointer flex-1">
                                  Bank Transfer
                                </label>
                                <Banknote className="h-5 w-5 text-gray-600" />
                              </div>
                              <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg">
                                <RadioGroupItem value="ussd" id="ussd" />
                                <label htmlFor="ussd" className="font-medium cursor-pointer flex-1">
                                  USSD
                                </label>
                                <Smartphone className="h-5 w-5 text-gray-600" />
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-primary-brand text-white py-3 text-lg font-semibold hover:bg-primary-brand/90 transition-colors duration-200 mt-6"
                      disabled={isProcessing || checkoutMutation.isPending}
                      size="lg"
                    >
                      {isProcessing ? "Processing..." : `Pay ${formatPrice(finalTotal)}`}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 bg-gray-200 rounded bg-cover bg-center flex-shrink-0"
                        style={{
                          backgroundImage: item.product.imageUrl ? `url(${item.product.imageUrl})` : 'none'
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium text-sm">
                        {formatPrice(parseFloat(item.product.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? "text-secondary-brand" : ""}>
                      {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary-brand">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center space-x-2 p-3 bg-secondary-brand/10 rounded-lg">
                  <Lock className="h-4 w-4 text-secondary-brand" />
                  <span className="text-sm text-foreground">256-bit SSL Encryption</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
