import { useQuery } from "@tanstack/react-query";

interface StoreSettings {
  id: number;
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl?: string;
  deliveryOptions?: string[];
  pudoCollectionAddress?: any;
  pudoPreferredLocker?: string;
  // About page content
  aboutStory?: string;
  aboutValues?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  aboutStats?: {
    products?: string;
    customers?: string;
    orders?: string;
    satisfaction?: string;
  };
  aboutImages?: string[];
  // Contact page content
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  storeHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  // Fallback fields
  address?: string;
  whatsappPhone?: string;
}

export function useStoreSettings() {
  return useQuery<StoreSettings>({
    queryKey: ["/api/storefront/settings"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

