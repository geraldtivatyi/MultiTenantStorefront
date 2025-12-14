import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CartItem, Product } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    staleTime: 30000, // 30 seconds
  });

  const addToCartMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number }) => {
      const response = await apiRequest("/api/cart", "POST", data);
      const result = await response.json();
      
      // Check for stock-related errors
      if (response.status === 400 && result.error) {
        throw new Error(result.error);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      // Error will be handled by the component using this hook
      console.error('Add to cart error:', error);
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: async (data: { id: number; quantity: number }) => {
      const response = await apiRequest(`/api/cart/${data.id}`, "PUT", { quantity: data.quantity });
      const result = await response.json();
      
      // Check for stock-related errors
      if (response.status === 400 && result.error) {
        throw new Error(result.error);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      console.error('Update cart error:', error);
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/cart/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const cartTotal = cartQuery.data?.reduce((sum, item) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  ) || 0;

  const cartItemCount = cartQuery.data?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return {
    cartItems: cartQuery.data || [],
    cartTotal,
    cartItemCount,
    isLoading: cartQuery.isLoading,
    addToCart: addToCartMutation.mutateAsync,
    updateCart: updateCartMutation.mutateAsync,
    removeFromCart: removeFromCartMutation.mutateAsync,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCart: updateCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
  };
}
