import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderCardSkeleton, PageHeaderSkeleton } from "@/components/skeletons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { paystackService } from "@/lib/paystack";
import { 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  AlertCircle, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp,
  Search,
  Filter,
  ShoppingCart,
  Truck,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { Link } from "wouter";
import type { Order, OrderItem, Product } from "@shared/schema";

type OrderWithItems = Order & {
  items?: (OrderItem & { product: Product })[];
};

export function MyOrders() {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingPayments, setProcessingPayments] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  const { data: orders = [], isLoading, error } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders/my-orders"],
    enabled: isAuthenticated,
  });

  // Fetch order items for expanded order
  const { data: orderItems = [] } = useQuery<(OrderItem & { product: Product })[]>({
    queryKey: ["/api/orders", expandedOrder, "items"],
    enabled: expandedOrder !== null,
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest(`/api/orders/${orderId}/reorder`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Items added to cart",
        description: "The items from this order have been added to your cart.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add items to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete payment function with Paystack popup
  const completePayment = async (orderId: number, order: OrderWithItems) => {
    // Add order to processing set
    setProcessingPayments(prev => new Set(prev).add(orderId));
    
    try {
      // Initialize Paystack service
      await paystackService.initialize();
      
      // Get payment details from server
      const response = await apiRequest(`/api/orders/${orderId}/complete-payment`, "POST");
      const data = await response.json();
      
      // Process payment with Paystack popup
      await paystackService.makePayment({
        email: order.customerEmail,
        amount: parseFloat(order.total),
        reference: data.reference,
        onSuccess: (response) => {
          toast({
            title: "Payment successful!",
            description: `Order ${order.orderNumber} payment has been completed.`,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/orders/my-orders'] });
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
      console.error("Payment completion error:", error);
      console.error("Error details:", error instanceof Error ? error.message : 'Unknown error');
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove order from processing set
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch = searchQuery === "" || 
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground mt-2">Track and manage your order history</p>
        </div>
        
        {/* Test Mode Notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Test Mode:</strong> Use test card number 4084084084084081 for payment completion testing. No real charges will be made.
            <br />
            <strong>Note:</strong> Payments are processed in South African Rand (ZAR). Ensure your Paystack account supports ZAR currency.
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number or customer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load orders. Please try again later.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {orders.length === 0 
                  ? "When you place your first order, it will appear here."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {orders.length === 0 && (
                <Link href="/">
                  <Button>Start Shopping</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <Collapsible 
                  open={expandedOrder === order.id} 
                  onOpenChange={(open) => setExpandedOrder(open ? order.id : null)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          Order #{order.orderNumber || order.id}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Unknown date'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Shipping Address
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName}<br />
                          {order.shippingAddress}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Order Total
                        </h4>
                        <p className="text-lg font-semibold text-primary-brand">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Items
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {order.items?.length || 0} item(s)
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm">
                            {expandedOrder === order.id ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                View Details
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        {order.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => completePayment(order.id, order)}
                            disabled={processingPayments.has(order.id)}
                            className="bg-primary-brand hover:bg-primary-brand/90"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {processingPayments.has(order.id) ? "Processing..." : "Complete Payment"}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => reorderMutation.mutate(order.id)}
                          disabled={reorderMutation.isPending}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Reorder
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent className="mt-4">
                      <Separator className="mb-4" />
                      <div className="space-y-4">
                        <h4 className="font-medium">Order Items</h4>
                        {orderItems.length > 0 ? (
                          <div className="space-y-3">
                            {orderItems.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium">{item.product?.name || 'Product'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {item.quantity} × {formatPrice(item.price)}
                                  </p>
                                </div>
                                <p className="font-medium">
                                  {formatPrice(item.quantity * item.price)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Order details are being loaded...
                          </p>
                        )}
                        
                        <div className="pt-3 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total</span>
                            <span className="text-lg font-semibold text-primary-brand">
                              {formatPrice(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}