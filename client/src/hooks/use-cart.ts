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
      const response = await apiRequest("POST", "/api/cart", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: async (data: { id: number; quantity: number }) => {
      const response = await apiRequest("PUT", `/api/cart/${data.id}`, { quantity: data.quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
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
