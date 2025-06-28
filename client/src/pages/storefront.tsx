import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { useTenant } from "@/hooks/use-tenant";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Truck, Shield, RotateCcw } from "lucide-react";
import type { Product } from "@shared/schema";

export function Storefront() {
  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useTenant();
  
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/storefront/products"],
    enabled: !!tenant,
  });

  if (tenantError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Store not found. Please check the URL and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-brand to-purple-600 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div 
          className="relative bg-center bg-cover"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-brand/80 to-purple-600/80"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              {tenantLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-3/4 mx-auto bg-white/20" />
                  <Skeleton className="h-6 w-1/2 mx-auto bg-white/20" />
                </div>
              ) : (
                <>
                  <h1 className="text-4xl md:text-6xl font-bold mb-6">
                    {tenant?.heroTitle || "Latest Tech, Best Prices"}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 text-gray-100">
                    {tenant?.heroSubtitle || "Discover cutting-edge technology for your digital lifestyle"}
                  </p>
                </>
              )}
              <Link href="#products">
                <button className="bg-white text-primary-brand px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                  Shop Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Featured Products</h2>
          <p className="text-muted-foreground text-lg">Handpicked items just for you</p>
        </div>

        {productsError ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load products. Please try again later.
            </AlertDescription>
          </Alert>
        ) : productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onViewDetails={(product) => window.location.href = `/products/${product.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-secondary-brand/10 rounded-full p-4 mb-4">
                <Truck className="text-secondary-brand text-2xl h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Free Shipping</h3>
              <p className="text-muted-foreground">Free shipping on orders over ₦50,000</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-secondary-brand/10 rounded-full p-4 mb-4">
                <Shield className="text-secondary-brand text-2xl h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
              <p className="text-muted-foreground">Protected by Paystack encryption</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-secondary-brand/10 rounded-full p-4 mb-4">
                <RotateCcw className="text-secondary-brand text-2xl h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Returns</h3>
              <p className="text-muted-foreground">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
