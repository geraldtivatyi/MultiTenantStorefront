import { useState } from "react";
import { ShoppingCart, Search, User, Menu, Settings, LogOut, Package, LogIn, UserPlus, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTenant } from "@/hooks/use-tenant";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: tenant } = useTenant();
  const { cartItemCount } = useCart();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-primary-brand">
                {tenant?.name || "Store"}
              </span>
              {tenant?.subdomain && (
                <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                  {tenant.subdomain}.platform.com
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/" 
                className="text-gray-900 hover:text-primary-brand px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/search" 
                className="text-gray-600 hover:text-primary-brand px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Products
              </Link>
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-primary-brand px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-600 hover:text-primary-brand px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Contact
              </Link>
              <Link 
                href="/admin" 
                className="text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-orange-500"
              >
                Admin
              </Link>
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search Dialog */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-brand">
                  <Search className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Search Products</DialogTitle>
                  <DialogDescription>
                    Search for arts and crafts products in our collection.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <Input
                      placeholder="Search for products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
                          setIsSearchOpen(false);
                        }
                      }}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (searchQuery.trim()) {
                        window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
                        setIsSearchOpen(false);
                      }
                    }}
                    disabled={!searchQuery.trim()}
                  >
                    Search
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Try searching for: "paint", "brushes", "canvas", "polymer clay"
                </div>
              </DialogContent>
            </Dialog>
            
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-brand relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-error-brand text-white text-xs h-5 w-5 flex items-center justify-center p-0">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            {/* Authentication Controls */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-brand">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user?.username || 'User'
                        }
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-orders" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account-settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary-brand">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-primary-brand hover:bg-primary-brand/90">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-brand relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-error-brand text-white text-xs h-5 w-5 flex items-center justify-center p-0">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-brand">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    {tenant?.name || "Store"} Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Mobile Search */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Search className="h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-0 bg-transparent focus:ring-0 focus:border-0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
                            setIsMobileMenuOpen(false);
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          if (searchQuery.trim()) {
                            window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        disabled={!searchQuery.trim()}
                        size="sm"
                        className="bg-primary-brand hover:bg-primary-brand/90"
                      >
                        Go
                      </Button>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-3">
                    <Link 
                      href="/" 
                      className="flex items-center space-x-3 p-3 text-gray-900 hover:text-primary-brand hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg font-medium">Home</span>
                    </Link>
                    <Link 
                      href="/search" 
                      className="flex items-center space-x-3 p-3 text-gray-600 hover:text-primary-brand hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg font-medium">Products</span>
                    </Link>
                    <Link 
                      href="/about" 
                      className="flex items-center space-x-3 p-3 text-gray-600 hover:text-primary-brand hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg font-medium">About</span>
                    </Link>
                    <Link 
                      href="/contact" 
                      className="flex items-center space-x-3 p-3 text-gray-600 hover:text-primary-brand hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg font-medium">Contact</span>
                    </Link>
                    <Link 
                      href="/admin" 
                      className="flex items-center space-x-3 p-3 text-orange-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors border-l-4 border-orange-500"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg font-medium">Admin Panel</span>
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* User Section */}
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="bg-primary-brand/10 rounded-full p-2">
                          <User className="h-5 w-5 text-primary-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user?.firstName && user?.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user?.username || 'User'
                            }
                          </p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Link 
                          href="/my-orders" 
                          className="flex items-center space-x-3 p-3 text-gray-600 hover:text-primary-brand hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Package className="h-5 w-5" />
                          <span>My Orders</span>
                        </Link>
                        <Link 
                          href="/account-settings" 
                          className="flex items-center space-x-3 p-3 text-gray-600 hover:text-primary-brand hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-5 w-5" />
                          <span>Account Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                          disabled={isLoggingOut}
                          className="flex items-center space-x-3 p-3 w-full text-left text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link 
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button variant="outline" className="w-full justify-start">
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                      <Link 
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button className="w-full justify-start bg-primary-brand hover:bg-primary-brand/90">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
