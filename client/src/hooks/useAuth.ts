import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string; // platform_admin, customer
  isAdmin: boolean; // deprecated, use role instead
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user: User | null;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: authStatus, isLoading, error } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/logout", "POST");
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Reload page to reset authentication state
      window.location.href = "/";
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: authStatus?.user || null,
    isAuthenticated: authStatus?.authenticated || false,
    isLoading,
    error,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}

export function useRequireAuth() {
  const auth = useAuth();
  
  return {
    ...auth,
    requireAuth: () => {
      if (!auth.isLoading && !auth.isAuthenticated) {
        window.location.href = "/login";
        return false;
      }
      return true;
    }
  };
}