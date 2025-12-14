import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartItemComponent } from "@/components/cart/cart-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { calculateCartTotal, formatPrice } from "@/lib/utils";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { CartItemSkeleton } from "@/components/skeletons";

export function Cart() {
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const { cartItems, isLoading } = useCart();
  const { toast } = useToast();
  const { subtotal, tax, total } = calculateCartTotal(cartItems);
  const finalTotal = total - discount;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <Link href="/">
            <Button variant="ghost" className="text-primary-brand hover:text-primary-brand/80 self-start">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Continue Shopping</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">Shopping Cart</h1>
          <div className="hidden sm:block w-32"></div>
        </div>

        {isLoading ? (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CartItemSkeleton key={i} />
              ))}
            </div>
            <div className="order-first lg:order-last">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="h-5 bg-muted animate-pulse rounded w-full" />
                    <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-10 bg-muted animate-pulse rounded w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <ShoppingBag className="h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 px-4">Add some products to get started!</p>
            <Link href="/">
              <Button className="bg-primary-brand text-white hover:bg-primary-brand/90">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 order-last lg:order-first">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Your Items ({cartItems.length})</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItemComponent key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <Card className="lg:sticky lg:top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-secondary-brand">Free</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-secondary-brand">
                        <span>Discount ({promoCode})</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary-brand">{formatPrice(finalTotal)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/checkout">
                    <Button className="w-full bg-primary-brand text-white py-3 text-lg font-semibold hover:bg-primary-brand/90 transition-colors duration-200">
                      Proceed to Checkout
                    </Button>
                  </Link>

                  {/* Promo Code */}
                  <div className="pt-4 border-t">
                    <Label htmlFor="promo" className="text-sm font-medium">
                      Promo Code
                    </Label>
                    <div className="flex space-x-2 mt-2">
                      <Input 
                        id="promo"
                        placeholder="Enter code" 
                        className="flex-1"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const code = promoCode.toUpperCase();
                          if (code === 'FASHION10') {
                            setDiscount(subtotal * 0.1);
                            toast({
                              title: "Promo code applied!",
                              description: "10% discount applied to your order.",
                            });
                          } else if (code === 'STYLE20') {
                            setDiscount(subtotal * 0.2);
                            toast({
                              title: "Promo code applied!",
                              description: "20% discount applied to your order.",
                            });
                          } else if (code === '') {
                            toast({
                              title: "Please enter a promo code",
                              variant: "destructive",
                            });
                          } else {
                            toast({
                              title: "Invalid promo code",
                              description: "Please check your code and try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!promoCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                    {discount === 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Try codes: FASHION10, STYLE20
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
