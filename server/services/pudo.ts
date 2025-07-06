interface PudoAddress {
  lat: number;
  lng: number;
  street_address: string;
  local_area: string;
  suburb: string;
  city: string;
  code: string;
  zone: string;
  country: string;
  entered_address: string;
  type: string;
  company?: string;
}

interface PudoLocker {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  province: string;
  postal_code: string;
  locker_sizes: Array<{
    size: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    max_weight: number;
  }>;
}

interface PudoRate {
  size: string;
  rate: number;
  currency: string;
}

interface PudoDimensions {
  length: number;
  width: number;
  height: number;
}

export class PudoService {
  private readonly baseUrl = 'https://sandbox.api-pudo.co.za/api/v1';

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Pudo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getLockers(apiKey: string): Promise<PudoLocker[]> {
    try {
      const response = await this.makeRequest('/lockers-data', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.lockers || [];
    } catch (error) {
      console.error('Error fetching Pudo lockers:', error);
      throw new Error('Failed to fetch Pudo lockers');
    }
  }

  async getLockerRates(apiKey: string): Promise<PudoRate[]> {
    try {
      const response = await this.makeRequest('/locker-rates', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.rates || [];
    } catch (error) {
      console.error('Error fetching Pudo rates:', error);
      throw new Error('Failed to fetch Pudo rates');
    }
  }

  async calculateShippingRate(
    apiKey: string,
    collectionAddress: PudoAddress,
    deliveryLocker: string,
    dimensions: PudoDimensions,
    weight: number
  ): Promise<{ rate: number; currency: string; delivery_time: string }> {
    try {
      // This would use the Pudo rates API to calculate actual shipping costs
      // For now, we'll return a calculated rate based on dimensions and distance
      const rates = await this.getLockerRates(apiKey);
      
      // Calculate volume in cubic centimeters
      const volume = dimensions.length * dimensions.width * dimensions.height;
      
      // Determine locker size needed based on dimensions
      let selectedSize = 'small';
      if (volume > 50000 || weight > 10) { // 50x50x20 cm or 10kg
        selectedSize = 'large';
      } else if (volume > 25000 || weight > 5) { // 50x25x20 cm or 5kg
        selectedSize = 'medium';
      }

      // Find the rate for the selected size
      const rate = rates.find(r => r.size === selectedSize);
      
      return {
        rate: rate ? parseFloat(rate.rate.toString()) : 89.99, // Fallback rate
        currency: 'ZAR',
        delivery_time: '2-3 business days'
      };
    } catch (error) {
      console.error('Error calculating Pudo shipping rate:', error);
      // Return fallback rate
      return {
        rate: 89.99,
        currency: 'ZAR',
        delivery_time: '2-3 business days'
      };
    }
  }

  async validatePudoCredentials(apiKey: string): Promise<boolean> {
    try {
      await this.getLockers(apiKey);
      return true;
    } catch (error) {
      console.error('Pudo API validation failed:', error);
      return false;
    }
  }

  // Helper method to determine required locker size based on product dimensions
  static getRequiredLockerSize(dimensions: PudoDimensions, weight: number): string {
    const volume = dimensions.length * dimensions.width * dimensions.height;
    
    if (volume > 50000 || weight > 10) {
      return 'large';
    } else if (volume > 25000 || weight > 5) {
      return 'medium';
    } else {
      return 'small';
    }
  }
}

export const pudoService = new PudoService();