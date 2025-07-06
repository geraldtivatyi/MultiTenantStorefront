import { useQuery } from "@tanstack/react-query";
import type { Tenant } from "@shared/schema";

interface TenantInfo {
  id: number;
  name: string;
  subdomain: string;
  heroTitle: string;
  heroSubtitle: string;
  deliveryOptions?: string[];
  pudoApiKey?: string;
  pudoCollectionAddress?: any;
  pudoPreferredLocker?: string;
}

export function useTenant() {
  return useQuery<TenantInfo>({
    queryKey: ["/api/storefront/tenant"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
