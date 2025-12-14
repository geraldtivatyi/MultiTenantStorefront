import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch, useLocation, Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchResultsSkeleton, ProductGridSkeleton } from "@/components/skeletons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search as SearchIcon, Filter, SlidersHorizontal, Grid, List, ArrowUpDown } from "lucide-react";
import type { Product } from "@shared/schema";

export function Search() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  const initialQuery = urlParams.get('q') || '';
  const initialCategory = urlParams.get('category') || 'all';
  const initialSort = urlParams.get('sort') || 'name';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/storefront/products"],
  });

  // Get unique categories
  const categories = useMemo(() => {
    const cats: string[] = [];
    const seen = new Set<string>();
    
    products.forEach(product => {
      if (product.category && !seen.has(product.category)) {
        cats.push(product.category);
        seen.add(product.category);
      }
    });
    
    return cats.sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'name') params.set('sort', sortBy);
    
    setLocation(`/search${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category !== 'all') params.set('category', category);
    if (sortBy !== 'name') params.set('sort', sortBy);
    
    setLocation(`/search${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sort !== 'name') params.set('sort', sort);
    
    setLocation(`/search${params.toString() ? '?' + params.toString() : ''}`);
  };

  if (productsError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert>
            <AlertDescription>
              Unable to load products. Please try again later.
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleSearch(searchQuery)}>
              Search
            </Button>
          </div>

          {/* Results Summary */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} results
                {searchQuery && ` for "${searchQuery}"`}
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              </span>
              {(searchQuery || selectedCategory !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setLocation('/search');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          {/* Sidebar Filters */}
          <div className="lg:w-64 shrink-0">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className={`space-y-6 ${!showFilters ? 'hidden lg:block' : ''}`}>
                  {/* Categories */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Categories</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCategoryChange('all')}
                        className={`block w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                          selectedCategory === 'all'
                            ? 'bg-primary-brand text-white'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={`block w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                            selectedCategory === category
                              ? 'bg-primary-brand text-white'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory !== 'all' || searchQuery) && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        handleSearch('');
                      }}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {selectedCategory}
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid/List */}
            {productsLoading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <SearchIcon className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery 
                    ? `No products match "${searchQuery}"`
                    : "Try adjusting your filters or search terms"
                  }
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setLocation('/search');
                }}>
                  View All Products
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full"
                : "space-y-4 w-full"
              }>
                {filteredProducts.map((product) => (
                  <div key={product.id} className={viewMode === 'grid' ? "w-full min-w-0" : ""}>
                    {viewMode === 'grid' ? (
                      <ProductCard 
                        product={product}
                        onViewDetails={(product) => setLocation(`/products/${product.id}`)}
                      />
                    ) : (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div 
                              className="w-24 h-24 bg-cover bg-center rounded-lg flex-shrink-0"
                              style={{
                                backgroundImage: `url(${product.imageUrl || 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300'})`
                              }}
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {product.description?.substring(0, 100)}...
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-primary-brand">
                                    R{parseFloat(product.price).toFixed(2)}
                                  </span>
                                  {product.category && (
                                    <Badge variant="outline" className="text-xs">
                                      {product.category}
                                    </Badge>
                                  )}
                                </div>
                                <Link href={`/products/${product.id}`}>
                                  <Button size="sm">View Details</Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Load More / Pagination could go here */}
            {filteredProducts.length > 0 && (
              <div className="text-center mt-12">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}