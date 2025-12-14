import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, Star, Minus, Plus, Palette, Award, Heart, Truck, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Product } from "@shared/schema";

export function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isAddingToCart } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/storefront/products/${id}`],
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addToCart({ productId: product.id, quantity });
      toast({
        title: "Added to cart",
        description: `${quantity} x ${product.name} added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Product not found or failed to load. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-4 sm:mb-6 text-primary-brand hover:text-primary-brand/80 hover:bg-primary-brand/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>
        </Link>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <Skeleton className="w-full h-[400px] lg:h-[500px] rounded-lg" />
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        ) : product ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 lg:mb-16">
              {/* Product Images */}
              <div className="sticky top-4 self-start">
                <div 
                  className="w-full h-[400px] lg:h-[500px] bg-gray-100 rounded-lg shadow-md overflow-hidden bg-cover bg-center mb-4"
                  style={{
                    backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none'
                  }}
                >
                  {!product.imageUrl && (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                      <div className="text-center">
                        <Package className="h-16 w-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No Image Available</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div 
                      key={i}
                      className="h-20 lg:h-24 bg-gray-100 rounded-lg cursor-pointer hover:opacity-75 transition-opacity border-2 border-transparent hover:border-primary-brand overflow-hidden"
                      style={{
                        backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!product.imageUrl && (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                {/* Product Title and Category */}
                <div>
                  {product.category && (
                    <Badge variant="secondary" className="mb-3 text-xs sm:text-sm">
                      {product.category}
                    </Badge>
                  )}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight">
                    {product.name}
                  </h1>
                  
                  {/* Stock Status */}
                  {product.stock !== null && (
                    <div className="mb-4">
                      {product.stock === 0 ? (
                        <Badge variant="destructive" className="text-sm">
                          Out of Stock
                        </Badge>
                      ) : product.stock < 10 ? (
                        <Badge variant="outline" className="text-sm text-orange-600 border-orange-300">
                          Only {product.stock} left in stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-sm text-green-600 border-green-300">
                          In Stock
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-brand">
                    {formatPrice(product.price)}
                  </p>
                </div>
                
                {/* Description */}
                <div className="border-t border-b border-gray-200 py-6">
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {product.longDescription || product.description || "No description available."}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">Quantity</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center justify-center min-w-[60px] h-10 px-4 border border-gray-300 rounded-md bg-white font-semibold text-lg">
                      {quantity}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={product.stock !== null && quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {product.stock !== null && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Max: {product.stock})
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <Button
                    className="w-full bg-primary-brand text-white py-6 text-base sm:text-lg font-semibold hover:bg-primary-brand/90 transition-colors duration-200 shadow-md"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || product.stock === 0}
                    size="lg"
                  >
                    {isAddingToCart ? (
                      "Adding to Cart..."
                    ) : product.stock === 0 ? (
                      'Out of Stock'
                    ) : (
                      `Add to Cart - ${formatPrice(parseFloat(product.price) * quantity)}`
                    )}
                  </Button>
                  <Link href="/checkout">
                    <Button
                      variant="outline"
                      className="w-full py-6 text-base sm:text-lg font-semibold border-2 border-primary-brand text-primary-brand hover:bg-primary-brand hover:text-white transition-colors duration-200"
                      size="lg"
                      disabled={product.stock === 0 || isAddingToCart}
                      onClick={async () => {
                        if (product.stock === 0) return;
                        try {
                          await addToCart({ productId: product.id, quantity });
                          toast({
                            title: "Added to cart",
                            description: `${quantity} x ${product.name} added to your cart.`,
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to add item to cart. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Buy Now
                    </Button>
                  </Link>
                </div>

                {/* Product Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-primary-brand/10 rounded-full p-2">
                      <Truck className="h-5 w-5 text-primary-brand" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Free Shipping</p>
                      <p className="text-xs text-muted-foreground">On orders over R500</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-primary-brand/10 rounded-full p-2">
                      <Shield className="h-5 w-5 text-primary-brand" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Secure Payment</p>
                      <p className="text-xs text-muted-foreground">100% secure checkout</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Features Section */}
            <div className="mt-12 lg:mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center lg:text-left">Why Choose Our Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <div className="text-center lg:text-left p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-primary-brand/10 rounded-full p-4 w-16 h-16 mx-auto lg:mx-0 mb-4 flex items-center justify-center">
                    <Award className="text-primary-brand h-7 w-7" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Premium Quality</h3>
                  <p className="text-muted-foreground text-sm">High-quality materials and craftsmanship for lasting value</p>
                </div>
                <div className="text-center lg:text-left p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-primary-brand/10 rounded-full p-4 w-16 h-16 mx-auto lg:mx-0 mb-4 flex items-center justify-center">
                    <Heart className="text-primary-brand h-7 w-7" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Trendy Designs</h3>
                  <p className="text-muted-foreground text-sm">Latest trends and timeless classics to suit your style</p>
                </div>
                <div className="text-center lg:text-left p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-primary-brand/10 rounded-full p-4 w-16 h-16 mx-auto lg:mx-0 mb-4 flex items-center justify-center">
                    <Palette className="text-primary-brand h-7 w-7" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Perfect Fit</h3>
                  <p className="text-muted-foreground text-sm">Carefully designed for comfort, style, and everyday wear</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Product not found. Please check the URL and try again.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
