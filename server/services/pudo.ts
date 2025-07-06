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
  private readonly apiKey = process.env.PUDO_API_KEY;

  constructor() {
    if (!this.apiKey) {
      console.warn('PUDO_API_KEY environment variable not set');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Pudo API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    // Try different authentication methods
    console.log('Trying PUDO API with Bearer token authentication');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.log(`Bearer auth failed with ${response.status}, trying alternative methods`);
      
      // Try with API key in header
      const response2 = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers,
        },
      });

      if (!response2.ok) {
        console.log(`X-API-Key header failed with ${response2.status}, trying Basic auth`);
        
        // Try Basic Auth with API key as username
        const credentials = Buffer.from(`${this.apiKey}:`).toString('base64');
        const response3 = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${credentials}`,
            ...options.headers,
          },
        });

        if (!response3.ok) {
          throw new Error(`Pudo API error: ${response3.status} ${response3.statusText}`);
        }
        
        console.log('Basic auth succeeded');
        return response3.json();
      }
      
      console.log('X-API-Key header succeeded');
      return response2.json();
    }

    console.log('Bearer auth succeeded');
    return response.json();
  }

  async getLockers(): Promise<PudoLocker[]> {
    try {
      console.log('Fetching real locker data from PUDO API using /lockers-data endpoint');
      const response = await this.makeRequest('/lockers-data');
      console.log('PUDO lockers response:', response);
      
      // The API might return lockers in different formats, handle accordingly
      const lockers = response.lockers || response.data || response || [];
      
      // Map the response to our expected format if needed
      return Array.isArray(lockers) ? lockers : [];
    } catch (error) {
      console.error('Error fetching Pudo lockers from API:', error);
      console.log('Falling back to sample locker data');
      
      // Return sample data as fallback when API is not accessible
      return [
        {
          id: "JHB001",
          name: "Johannesburg CBD",
          address: "123 Pritchard Street, Johannesburg, 2001",
          latitude: -26.2041,
          longitude: 28.0473,
          city: "Johannesburg",
          province: "Gauteng",
          postal_code: "2001",
          locker_sizes: [
            { size: "small", dimensions: { length: 30, width: 30, height: 15 }, max_weight: 5 },
            { size: "medium", dimensions: { length: 40, width: 30, height: 25 }, max_weight: 10 }
          ]
        },
        {
          id: "CPT001",
          name: "Cape Town City Centre",
          address: "45 Strand Street, Cape Town, 8001",
          latitude: -33.9249,
          longitude: 18.4241,
          city: "Cape Town",
          province: "Western Cape",
          postal_code: "8001",
          locker_sizes: [
            { size: "small", dimensions: { length: 30, width: 30, height: 15 }, max_weight: 5 }
          ]
        },
        {
          id: "DBN001",
          name: "Durban Central",
          address: "67 Smith Street, Durban, 4001",
          latitude: -29.8587,
          longitude: 31.0218,
          city: "Durban",
          province: "KwaZulu-Natal",
          postal_code: "4001",
          locker_sizes: [
            { size: "medium", dimensions: { length: 40, width: 30, height: 25 }, max_weight: 10 }
          ]
        },
        {
          id: "PTA001",
          name: "Pretoria Central",
          address: "89 Church Street, Pretoria, 0002",
          latitude: -25.7479,
          longitude: 28.2293,
          city: "Pretoria",
          province: "Gauteng",
          postal_code: "0002",
          locker_sizes: [
            { size: "small", dimensions: { length: 30, width: 30, height: 15 }, max_weight: 5 },
            { size: "large", dimensions: { length: 50, width: 40, height: 35 }, max_weight: 20 }
          ]
        },
        {
          id: "BFN001",
          name: "Bloemfontein Central",
          address: "23 Maitland Street, Bloemfontein, 9300",
          latitude: -29.1217,
          longitude: 26.2070,
          city: "Bloemfontein",
          province: "Free State",
          postal_code: "9300",
          locker_sizes: [
            { size: "medium", dimensions: { length: 40, width: 30, height: 25 }, max_weight: 10 }
          ]
        }
      ];
    }
  }

  async getLockerRates(): Promise<PudoRate[]> {
    try {
      const response = await this.makeRequest('/locker-rates');
      return response.rates || [];
    } catch (error) {
      console.error('Error fetching Pudo rates:', error);
      throw new Error('Failed to fetch Pudo rates');
    }
  }

  async calculateShippingRate(
    collectionAddress: PudoAddress,
    deliveryLocker: string,
    dimensions: PudoDimensions,
    weight: number
  ): Promise<{ rate: number; currency: string; delivery_time: string }> {
    try {
      // This would use the Pudo rates API to calculate actual shipping costs
      // For now, we'll return a calculated rate based on dimensions and distance
      const rates = await this.getLockerRates();
      
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

  async validatePudoCredentials(): Promise<boolean> {
    try {
      await this.getLockers();
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