import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, Product } from "@shared/schema";

interface CartItemProps {
  item: CartItem & { product: Product };
}

export function CartItemComponent({ item }: CartItemProps) {
  const { updateCart, removeFromCart, isUpdatingCart, isRemovingFromCart } = useCart();
  const { toast } = useToast();

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await updateCart({ id: item.id, quantity: newQuantity });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart item.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async () => {
    try {
      await removeFromCart(item.id);
      toast({
        title: "Item removed",
        description: `${item.product.name} has been removed from your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const itemTotal = parseFloat(item.product.price) * item.quantity;

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-6 flex items-center space-x-4">
        <div 
          className="w-20 h-20 bg-gray-200 rounded-lg bg-cover bg-center flex-shrink-0"
          style={{
            backgroundImage: item.product.imageUrl ? `url(${item.product.imageUrl})` : 'none'
          }}
        >
          {!item.product.imageUrl && (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{item.product.name}</h3>
          <p className="text-gray-600 text-sm">{item.product.description}</p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleUpdateQuantity(item.quantity - 1)}
                disabled={isUpdatingCart || item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 bg-gray-100 rounded min-w-[3rem] text-center">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleUpdateQuantity(item.quantity + 1)}
                disabled={isUpdatingCart}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-error-brand hover:text-error-brand/80 hover:bg-error-brand/10"
              onClick={handleRemove}
              disabled={isRemovingFromCart}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xl font-bold text-primary-brand">
            {formatPrice(itemTotal)}
          </p>
          <p className="text-sm text-gray-500">
            {formatPrice(item.product.price)} each
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
