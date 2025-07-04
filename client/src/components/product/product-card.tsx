import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { addToCart, isAddingToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = async () => {
    try {
      await addToCart({ productId: product.id, quantity: 1 });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col">
      <div 
        className="w-full h-48 sm:h-56 bg-gray-200 bg-cover bg-center cursor-pointer flex-shrink-0"
        style={{
          backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none'
        }}
        onClick={() => onViewDetails?.(product)}
      >
        {!product.imageUrl && (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
      </div>
      
      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
        <h3 
          className="text-base sm:text-lg font-semibold mb-2 cursor-pointer hover:text-primary-brand transition-colors line-clamp-2"
          onClick={() => onViewDetails?.(product)}
        >
          {product.name}
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2 flex-1">
          {product.description}
        </p>
        <div className="mt-auto space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold text-primary-brand">
              {formatPrice(product.price)}
            </span>
            <Button 
              className="bg-primary-brand text-white hover:bg-primary-brand/90 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock === 0}
              size="sm"
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
          {product.stock && product.stock < 10 && product.stock > 0 && (
            <p className="text-xs sm:text-sm text-orange-600 mt-2">
              Only {product.stock} left in stock
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
