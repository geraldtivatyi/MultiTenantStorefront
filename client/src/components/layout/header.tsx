import { ShoppingCart, Search, User, Menu } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/use-tenant";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { data: tenant } = useTenant();
  const { cartItemCount } = useCart();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-primary-brand">
                {tenant?.name || "Store"}
              </span>
              {tenant?.subdomain && (
                <span className="text-xs text-gray-500 ml-2">
                  {tenant.subdomain}.platform.com
                </span>
              )}
            </Link>
          </div>

          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/" 
                className="text-gray-900 hover:text-primary-brand px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/products" 
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
            </div>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-brand">
              <Search className="h-5 w-5" />
            </Button>
            
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
            
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-brand">
              <User className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="md:hidden text-gray-600 hover:text-primary-brand">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
