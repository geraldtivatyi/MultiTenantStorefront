import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { useTenant } from "@/hooks/use-tenant";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Truck, Shield, RotateCcw } from "lucide-react";
import type { Product } from "@shared/schema";

export function Storefront() {
  const searchParams = useSearch();
  const searchQuery = new URLSearchParams(searchParams).get('search') || '';
  
  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useTenant();
  
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/storefront/products"],
    enabled: !!tenant,
  });

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query)) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

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
            backgroundImage: "url('https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/70 to-pink-600/70"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
            <div className="text-center">
              {tenantLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 sm:h-12 w-3/4 mx-auto bg-white/20" />
                  <Skeleton className="h-4 sm:h-6 w-1/2 mx-auto bg-white/20" />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                    {tenant?.heroTitle || "Latest Tech, Best Prices"}
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-100 max-w-3xl mx-auto px-4">
                    {tenant?.heroSubtitle || "Discover cutting-edge technology for your digital lifestyle"}
                  </p>
                </>
              )}
              <Link href="#products">
                <button className="bg-white text-orange-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg">
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
          {searchQuery ? (
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Search Results</h2>
              <p className="text-muted-foreground mb-4">
                Showing results for "<span className="font-medium text-foreground">{searchQuery}</span>"
              </p>
              {filteredProducts.length === 0 && products.length > 0 && (
                <p className="text-muted-foreground">
                  No products found. <Link href="/" className="text-primary-brand hover:underline">View all products</Link>
                </p>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Featured Products</h2>
              <p className="text-muted-foreground text-lg">Handpicked items just for you</p>
            </div>
          )}
        </div>

        {productsError ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load products. Please try again later.
            </AlertDescription>
          </Alert>
        ) : productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 sm:h-56 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-base sm:text-lg px-4">
              {searchQuery ? "No products found matching your search." : "No products available at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
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
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="flex flex-col items-center p-4">
              <div className="bg-secondary-brand/10 rounded-full p-3 sm:p-4 mb-3 sm:mb-4">
                <Truck className="text-secondary-brand h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Free Shipping</h3>
              <p className="text-muted-foreground text-sm sm:text-base">Free shipping on orders over R500</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="bg-secondary-brand/10 rounded-full p-3 sm:p-4 mb-3 sm:mb-4">
                <Shield className="text-secondary-brand h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Secure Payment</h3>
              <p className="text-muted-foreground text-sm sm:text-base">Protected by Paystack encryption</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="bg-secondary-brand/10 rounded-full p-3 sm:p-4 mb-3 sm:mb-4">
                <RotateCcw className="text-secondary-brand h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Easy Returns</h3>
              <p className="text-muted-foreground text-sm sm:text-base">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
