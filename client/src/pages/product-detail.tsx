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
import { ArrowLeft, Star, Minus, Plus, Cpu, Monitor, Battery } from "lucide-react";
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
    queryKey: ["/api/storefront/products", id],
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-primary-brand hover:text-primary-brand/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>
        </Link>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="w-full h-96" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          </div>
        ) : product ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Product Images */}
              <div>
                <div 
                  className="w-full h-96 bg-gray-200 rounded-lg shadow-lg bg-cover bg-center"
                  style={{
                    backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none'
                  }}
                >
                  {!product.imageUrl && (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image Available
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Gallery - Placeholder for future implementation */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div 
                      key={i}
                      className="h-20 bg-gray-200 rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                      style={{
                        backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Product Details */}
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-4">{product.name}</h1>
                
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-muted-foreground">(127 reviews)</span>
                </div>
                
                <p className="text-4xl font-bold text-primary-brand mb-6">
                  {formatPrice(product.price)}
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {product.longDescription || product.description || "No description available."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-medium px-4">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={product.stock !== null && quantity >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {product.stock && product.stock < 10 && (
                      <p className="text-sm text-warning-color mt-2">
                        Only {product.stock} left in stock
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-primary-brand text-white py-3 text-lg font-semibold hover:bg-primary-brand/90 transition-colors duration-200"
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || product.stock === 0}
                      size="lg"
                    >
                      {product.stock === 0 ? 'Out of Stock' : `Add to Cart - ${formatPrice(parseFloat(product.price) * quantity)}`}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full py-3 text-lg font-semibold border-accent-brand text-accent-brand hover:bg-accent-brand hover:text-white transition-colors duration-200"
                      size="lg"
                      disabled={product.stock === 0}
                    >
                      Buy Now
                    </Button>
                  </div>

                  {product.category && (
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {product.category}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Features */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-8">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-primary-brand/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Cpu className="text-primary-brand text-xl h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">High Performance</h3>
                  <p className="text-muted-foreground">Advanced technology for ultimate performance</p>
                </div>
                <div className="text-center">
                  <div className="bg-primary-brand/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Monitor className="text-primary-brand text-xl h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Superior Display</h3>
                  <p className="text-muted-foreground">Crystal clear visuals with vibrant colors</p>
                </div>
                <div className="text-center">
                  <div className="bg-primary-brand/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Battery className="text-primary-brand text-xl h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Long Battery Life</h3>
                  <p className="text-muted-foreground">All-day power for your busy lifestyle</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
      
      <Footer />
    </div>
  );
}
