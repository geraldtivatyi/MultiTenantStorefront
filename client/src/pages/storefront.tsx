import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useAuth } from "@/hooks/useAuth";
import { ProductGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Truck, Shield, RotateCcw, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";

export function Storefront() {
  const searchParams = useSearch();
  const searchQuery = new URLSearchParams(searchParams).get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  
  const { data: storeSettings, isLoading: settingsLoading, error: settingsError } = useStoreSettings();
  const { user } = useAuth();
  
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/storefront/products"],
  });

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(product => {
      if (product.category) cats.add(product.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Apply sorting
    if (sortBy === "price-low") {
      filtered = [...filtered].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === "price-high") {
      filtered = [...filtered].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-brand to-purple-600 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div 
          className="relative bg-center bg-cover"
          style={{
            backgroundImage: storeSettings?.heroImageUrl 
              ? `url('${storeSettings.heroImageUrl}')`
              : "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/70 to-pink-600/70"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
            <div className="text-center">
              {settingsLoading ? (
                <PageHeaderSkeleton />
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                    {storeSettings?.heroTitle || "Welcome to M Blessings"}
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-100 max-w-3xl mx-auto px-4">
                    {storeSettings?.heroSubtitle || "Discover quality products and excellent service"}
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
        <div className="mb-8">
          {searchQuery ? (
            <div className="text-center mb-6">
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
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-foreground mb-4">Featured Products</h2>
              <p className="text-muted-foreground text-lg">Handpicked items just for you</p>
            </div>
          )}
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
              {selectedCategory !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="ml-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="default">Default</option>
                <option value="name">Name (A-Z)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
              </select>
            </div>
          </div>
          
          {selectedCategory !== "all" && (
            <div className="mb-4">
              <Badge variant="secondary" className="text-sm">
                Category: {selectedCategory} ({filteredProducts.length} products)
              </Badge>
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
          <ProductGridSkeleton count={8} />
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
