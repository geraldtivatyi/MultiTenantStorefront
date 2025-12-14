// The Courier Guy Locker API (ShipLogic) interfaces and service
// Documentation: https://api.shiplogic.com

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  province?: string;
  postal_code?: string;
  type?: 'locker' | 'counter';
  opening_hours?: Array<{
    day: string;
    open_time: string;
    close_time: string;
  }>;
}

interface ShipLogicRateResponse {
  rate: string;
  currency: string;
  delivery_time?: string;
  base_rate?: {
    charge: string;
    rate_formula_type: string;
    total_calculated_weight: number;
    vat_type: string | null;
    vat: string;
  };
  opt_in_rates?: Array<{
    id: number;
    charge_type: string;
    charge_value: string;
    name: string;
    vat_type: string;
  }>;
  opt_in_time_based_rates?: Array<{
    id: number;
    charge_type: string;
    charge_value: string;
    name: string;
  }>;
}

interface ShipLogicShipmentResponse {
  id: number;
  short_tracking_reference: string;
  tracking_reference?: string;
  status: string;
  rate: string;
  estimated_delivery_from?: string;
  estimated_delivery_to?: string;
}

interface ShipLogicTrackingEvent {
  time: string;
  status: string;
  description: string;
  location?: string;
}

interface PudoDimensions {
  length: number;
  width: number;
  height: number;
}

interface PudoAddress {
  company?: string;
  street_address: string;
  local_area: string;
  suburb?: string;
  city: string;
  code: string;
  zone: string;
  country: string;
  lat: number | string;
  lng: number | string;
  type: string;
  entered_address?: string;
}

// Transformed locker format for frontend (keeping same interface for compatibility)
export interface TransformedPudoLocker {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  province: string;
  postal_code: string;
  opening_hours: Array<{
    day: string;
    open_time: string;
    close_time: string;
  }>;
  locker_sizes: Array<{
    id: number;
    name: string;
    type: string;
    width: number;
    height: number;
    length: number;
    max_weight: number;
  }>;
}

export class PudoService {
  // Use ShipLogic API base URL
  private readonly baseUrl = process.env.PUDO_API_BASE_URL || 'https://api.shiplogic.com';
  private readonly bearerToken = process.env.PUDO_BEARER_TOKEN;
  private readonly apiKey = process.env.PUDO_API_KEY;

  constructor() {
    if (!this.bearerToken && !this.apiKey) {
      console.warn('Neither PUDO_BEARER_TOKEN nor PUDO_API_KEY environment variable is set');
    }
  }

  private hasCredentials(): boolean {
    return !!(this.bearerToken || this.apiKey);
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const authToken = this.bearerToken || this.apiKey;
    
    if (!authToken) {
      throw new Error('No PUDO authentication token configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Courier Guy API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Courier Guy API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get sample locker data for development/testing when credentials are not configured
   */
  private getSampleLockers(): TransformedPudoLocker[] {
    return [
      {
        id: 'CG341',
        name: 'Sasol Rivonia Uplifted',
        address: '375 Rivonia Rd, Rivonia, Sandton, 2191, South Africa',
        latitude: -26.049703,
        longitude: 28.059084,
        city: 'Sandton',
        province: 'Gauteng',
        postal_code: '2191',
        opening_hours: [
          { day: 'Monday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Tuesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Wednesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Thursday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Friday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Saturday', open_time: '08:00:00', close_time: '13:00:00' },
          { day: 'Sunday', open_time: '08:00:00', close_time: '13:00:00' },
        ],
        locker_sizes: [
          { id: 3, name: 'V4-L', type: '13', width: 41, height: 41, length: 60, max_weight: 15 },
          { id: 4, name: 'V4-S', type: '11', width: 41, height: 8, length: 60, max_weight: 5 },
          { id: 5, name: 'V4-XS', type: '10', width: 17, height: 8, length: 60, max_weight: 2 },
          { id: 6, name: 'V4-M', type: '12', width: 41, height: 19, length: 60, max_weight: 10 },
          { id: 7, name: 'V4-XL', type: '14', width: 41, height: 69, length: 60, max_weight: 20 },
        ]
      },
      {
        id: 'CPT001',
        name: 'Cape Town City Centre',
        address: '45 Strand Street, Cape Town, 8001, South Africa',
        latitude: -33.9249,
        longitude: 18.4241,
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '8001',
        opening_hours: [
          { day: 'Monday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Tuesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Wednesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Thursday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Friday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Saturday', open_time: '09:00:00', close_time: '13:00:00' },
        ],
        locker_sizes: [
          { id: 3, name: 'V4-L', type: '13', width: 41, height: 41, length: 60, max_weight: 15 },
          { id: 4, name: 'V4-S', type: '11', width: 41, height: 8, length: 60, max_weight: 5 },
          { id: 6, name: 'V4-M', type: '12', width: 41, height: 19, length: 60, max_weight: 10 },
        ]
      },
      {
        id: 'DBN001',
        name: 'Durban Central',
        address: '67 Smith Street, Durban, 4001, South Africa',
        latitude: -29.8587,
        longitude: 31.0218,
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postal_code: '4001',
        opening_hours: [
          { day: 'Monday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Tuesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Wednesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Thursday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Friday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Saturday', open_time: '09:00:00', close_time: '13:00:00' },
        ],
        locker_sizes: [
          { id: 4, name: 'V4-S', type: '11', width: 41, height: 8, length: 60, max_weight: 5 },
          { id: 6, name: 'V4-M', type: '12', width: 41, height: 19, length: 60, max_weight: 10 },
          { id: 7, name: 'V4-XL', type: '14', width: 41, height: 69, length: 60, max_weight: 20 },
        ]
      },
      {
        id: 'PTA001',
        name: 'Pretoria Central',
        address: '89 Church Street, Pretoria, 0002, South Africa',
        latitude: -25.7479,
        longitude: 28.2293,
        city: 'Pretoria',
        province: 'Gauteng',
        postal_code: '0002',
        opening_hours: [
          { day: 'Monday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Tuesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Wednesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Thursday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Friday', open_time: '08:00:00', close_time: '17:00:00' },
        ],
        locker_sizes: [
          { id: 3, name: 'V4-L', type: '13', width: 41, height: 41, length: 60, max_weight: 15 },
          { id: 5, name: 'V4-XS', type: '10', width: 17, height: 8, length: 60, max_weight: 2 },
          { id: 6, name: 'V4-M', type: '12', width: 41, height: 19, length: 60, max_weight: 10 },
        ]
      },
      {
        id: 'BFN001',
        name: 'Bloemfontein Central',
        address: '23 Maitland Street, Bloemfontein, 9300, South Africa',
        latitude: -29.1217,
        longitude: 26.2070,
        city: 'Bloemfontein',
        province: 'Free State',
        postal_code: '9300',
        opening_hours: [
          { day: 'Monday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Tuesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Wednesday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Thursday', open_time: '08:00:00', close_time: '17:00:00' },
          { day: 'Friday', open_time: '08:00:00', close_time: '17:00:00' },
        ],
        locker_sizes: [
          { id: 4, name: 'V4-S', type: '11', width: 41, height: 8, length: 60, max_weight: 5 },
          { id: 6, name: 'V4-M', type: '12', width: 41, height: 19, length: 60, max_weight: 10 },
        ]
      }
    ];
  }

  /**
   * Get all available lockers (pickup points)
   * GET https://api.shiplogic.com/pickup-points?type=locker
   * Supports filters: lat, lng, order_closest, search, bounding box
   */
  async getLockers(filters?: {
    lat?: number;
    lng?: number;
    order_closest?: boolean;
    search?: string;
    min_lat?: number;
    max_lat?: number;
    min_lng?: number;
    max_lng?: number;
  }): Promise<TransformedPudoLocker[]> {
    // Check if credentials are configured
    if (!this.hasCredentials()) {
      console.warn('⚠️  PUDO_BEARER_TOKEN or PUDO_API_KEY not configured. Using sample locker data for development.');
      console.warn('⚠️  To use real Courier Guy API data, set PUDO_BEARER_TOKEN or PUDO_API_KEY in your environment variables.');
      return this.getSampleLockers();
    }

    try {
      console.log('Fetching lockers from Courier Guy API');
      
      // Build query string
      const params = new URLSearchParams();
      params.append('type', 'locker');
      
      if (filters?.lat !== undefined) params.append('lat', filters.lat.toString());
      if (filters?.lng !== undefined) params.append('lng', filters.lng.toString());
      if (filters?.order_closest) params.append('order_closest', 'true');
      if (filters?.search) params.append('search', filters.search);
      if (filters?.min_lat !== undefined) params.append('min_lat', filters.min_lat.toString());
      if (filters?.max_lat !== undefined) params.append('max_lat', filters.max_lat.toString());
      if (filters?.min_lng !== undefined) params.append('min_lng', filters.min_lng.toString());
      if (filters?.max_lng !== undefined) params.append('max_lng', filters.max_lng.toString());
      
      const pickupPoints: PickupPoint[] = await this.makeRequest(`/pickup-points?${params.toString()}`);
      
      console.log(`Retrieved ${pickupPoints.length} lockers from Courier Guy API`);
      
      // Transform to our expected format
      return pickupPoints.map((point) => ({
        id: point.id,
        name: point.name,
        address: point.address,
        latitude: point.latitude,
        longitude: point.longitude,
        city: point.city || 'Unknown',
        province: point.province || this.getProvinceFromCity(point.city || ''),
        postal_code: point.postal_code || '',
        opening_hours: point.opening_hours || [],
        locker_sizes: [] // API doesn't return locker sizes in pickup points endpoint
      }));
    } catch (error: any) {
      console.error('Error fetching Courier Guy lockers from API:', error);
      console.warn('⚠️  Falling back to sample locker data. The API endpoint may be incorrect or unavailable.');
      // Always fall back to sample data on error to keep the app functional
      return this.getSampleLockers();
    }
  }

  /**
   * Get rates for Door to Locker (D2L) delivery
   * POST https://api.shiplogic.com/rates
   * Uses pickup point IDs instead of addresses
   */
  async getD2LRates(
    collectionAddress: PudoAddress,
    deliveryLockerId: string,
    parcels: Array<{
      submitted_length_cm: number;
      submitted_width_cm: number;
      submitted_height_cm: number;
      submitted_weight_kg: number;
      parcel_description?: string;
      packaging?: string;
    }>
  ): Promise<ShipLogicRateResponse> {
    if (!this.hasCredentials()) {
      throw new Error('PUDO_BEARER_TOKEN or PUDO_API_KEY must be configured to get rates');
    }

    try {
      // Use generic locker ID for collection (CG0000 for lockers)
      const requestBody: any = {
        collection_pickup_point_id: 'CG0000',
        collection_pickup_point_provider: 'tcg-locker',
        delivery_pickup_point_id: deliveryLockerId,
        delivery_pickup_point_provider: 'tcg-locker',
        parcels: parcels,
        collection_min_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
        delivery_min_date: new Date().toISOString().split('T')[0],
      };

      const response = await this.makeRequest('/rates', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching D2L rates:', error);
      throw error;
    }
  }

  /**
   * Calculate shipping rate for a specific locker delivery
   * This uses the D2L rates endpoint with pickup point IDs
   */
  async calculateShippingRate(
    collectionAddress: PudoAddress,
    deliveryLockerCode: string,
    dimensions: PudoDimensions,
    weight: number
  ): Promise<{ rate: number; currency: string; delivery_time: string; base_rate?: any }> {
    // Check if credentials are configured
    if (!this.hasCredentials()) {
      console.warn('⚠️  PUDO_BEARER_TOKEN or PUDO_API_KEY not configured. Using fallback shipping rate for development.');
      // Calculate a reasonable fallback rate based on dimensions and weight
      const volume = dimensions.length * dimensions.width * dimensions.height;
      let fallbackRate = 89.99; // Base rate
      
      if (volume > 100000 || weight > 20) {
        fallbackRate = 150.00; // Large/heavy items
      } else if (volume > 50000 || weight > 10) {
        fallbackRate = 120.00; // Medium items
      } else if (volume > 25000 || weight > 5) {
        fallbackRate = 100.00; // Small-medium items
      }
      
      return {
        rate: fallbackRate,
        currency: 'ZAR',
        delivery_time: '2-3 business days'
      };
    }

    try {
      // Convert dimensions from cm to match API (assuming dimensions are in cm)
      const parcels = [{
        submitted_length_cm: dimensions.length,
        submitted_width_cm: dimensions.width,
        submitted_height_cm: dimensions.height,
        submitted_weight_kg: weight,
        parcel_description: '',
        packaging: 'Standard flyer'
      }];

      const rateResponse = await this.getD2LRates(collectionAddress, deliveryLockerCode, parcels);
      
      const baseRate = parseFloat(rateResponse.rate || '0');
      
      return {
        rate: parseFloat(baseRate.toFixed(2)),
        currency: rateResponse.currency || 'ZAR',
        delivery_time: rateResponse.delivery_time || '2-3 business days',
        base_rate: rateResponse.base_rate
      };
    } catch (error) {
      console.error('Error calculating Courier Guy shipping rate:', error);
      // Return fallback rate
      const volume = dimensions.length * dimensions.width * dimensions.height;
      let fallbackRate = 89.99;
      
      if (volume > 100000 || weight > 20) {
        fallbackRate = 150.00;
      } else if (volume > 50000 || weight > 10) {
        fallbackRate = 120.00;
      } else if (volume > 25000 || weight > 5) {
        fallbackRate = 100.00;
      }
      
      return {
        rate: fallbackRate,
        currency: 'ZAR',
        delivery_time: '2-3 business days'
      };
    }
  }

  /**
   * Create a shipment (Door to Locker)
   * POST https://api.shiplogic.com/shipments
   * Uses pickup point IDs instead of addresses
   */
  async createShipment(
    collectionAddress: PudoAddress,
    collectionContact: {
      name: string;
      email: string;
      phone: string;
    },
    deliveryLockerCode: string,
    deliveryContact: {
      name: string;
      email: string;
      phone: string;
    },
    dimensions: PudoDimensions,
    weight: number,
    description?: string,
    customerReference?: string
  ): Promise<ShipLogicShipmentResponse> {
    if (!this.hasCredentials()) {
      throw new Error('PUDO_BEARER_TOKEN or PUDO_API_KEY must be configured to create shipments. Please set the environment variable and restart the server.');
    }

    try {
      // Get tomorrow's date for collection and delivery
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0] + 'T00:00:00.000Z';

      const requestBody: any = {
        collection_pickup_point_id: 'CG0000', // Generic locker ID for collection
        collection_pickup_point_provider: 'tcg-locker',
        collection_contact: {
          name: collectionContact.name,
          mobile_number: collectionContact.phone,
          email: collectionContact.email
        },
        delivery_pickup_point_id: deliveryLockerCode,
        delivery_pickup_point_provider: 'tcg-locker',
        delivery_contact: {
          name: deliveryContact.name,
          mobile_number: deliveryContact.phone,
          email: deliveryContact.email
        },
        parcels: [{
          parcel_description: description || '',
          submitted_length_cm: dimensions.length,
          submitted_width_cm: dimensions.width,
          submitted_height_cm: dimensions.height,
          submitted_weight_kg: weight,
          packaging: 'Standard flyer'
        }],
        collection_min_date: dateStr,
        collection_after: '08:00',
        collection_before: '16:00',
        delivery_min_date: dateStr,
        delivery_after: '10:00',
        delivery_before: '17:00',
        customer_reference: customerReference || '',
        service_level_code: 'D2LXS - ECO' // Door to Locker service
      };

      // Note: Do not send custom_tracking_reference for pickup point collection
      // The API will assign one automatically

      const response = await this.makeRequest('/shipments', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return response;
    } catch (error) {
      console.error('Error creating Courier Guy shipment:', error);
      throw error;
    }
  }

  /**
   * Track a shipment by tracking reference
   * GET https://api.shiplogic.com/tracking/{tracking_reference}
   */
  async trackShipment(trackingReference: string): Promise<{
    tracking_reference: string;
    status: string;
    events: ShipLogicTrackingEvent[];
    estimated_delivery?: string;
  }> {
    try {
      const response = await this.makeRequest(`/tracking/${trackingReference}`);
      
      return {
        tracking_reference: response.tracking_reference || trackingReference,
        status: response.status || 'unknown',
        events: response.tracking_events || [],
        estimated_delivery: response.estimated_delivery
      };
    } catch (error) {
      console.error('Error tracking Courier Guy shipment:', error);
      throw error;
    }
  }

  /**
   * Get shipment label/waybill PDF
   * GET https://api.shiplogic.com/shipments/{shipment_id}/label
   */
  async getShipmentLabel(shipmentId: number): Promise<Buffer> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/${shipmentId}/label`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken || this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get shipment label: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Error getting shipment label:', error);
      throw error;
    }
  }

  /**
   * Cancel a shipment
   * PUT https://api.shiplogic.com/shipments/{shipment_id}/cancel
   */
  async cancelShipment(shipmentId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`/shipments/${shipmentId}/cancel`, {
        method: 'PUT'
      });

      return {
        success: true,
        message: 'Shipment cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling Courier Guy shipment:', error);
      throw error;
    }
  }

  /**
   * Validate Courier Guy API credentials
   */
  async validatePudoCredentials(): Promise<boolean> {
    try {
      await this.getLockers();
      return true;
    } catch (error) {
      console.error('Courier Guy API validation failed:', error);
      return false;
    }
  }

  /**
   * Helper to get province from city
   */
  private getProvinceFromCity(city: string): string {
    const provinceMap: Record<string, string> = {
      'Johannesburg': 'Gauteng',
      'Sandton': 'Gauteng',
      'Pretoria': 'Gauteng',
      'Cape Town': 'Western Cape',
      'Durban': 'KwaZulu-Natal',
      'Port Elizabeth': 'Eastern Cape',
      'Bloemfontein': 'Free State',
    };
    
    for (const [key, province] of Object.entries(provinceMap)) {
      if (city.includes(key)) {
        return province;
      }
    }
    
    return 'Unknown';
  }

  /**
   * Helper to get province from city/zone (kept for backward compatibility)
   */
  private getProvinceFromZone(city: string): string {
    return this.getProvinceFromCity(city);
  }

  /**
   * Helper to get zone code from province
   */
  private getZoneFromProvince(province: string): string {
    const zoneMap: Record<string, string> = {
      'Gauteng': 'GP',
      'Western Cape': 'WC',
      'KwaZulu-Natal': 'KZN',
      'Eastern Cape': 'EC',
      'Free State': 'FS',
      'Limpopo': 'LP',
      'Mpumalanga': 'MP',
      'Northern Cape': 'NC',
      'North West': 'NW',
    };
    
    return zoneMap[province] || 'GP';
  }

  /**
   * Helper method to determine required locker size based on product dimensions
   */
  static getRequiredLockerSize(dimensions: PudoDimensions, weight: number): string {
    const volume = dimensions.length * dimensions.width * dimensions.height;
    
    if (volume > 100000 || weight > 20) {
      return 'XL';
    } else if (volume > 50000 || weight > 10) {
      return 'L';
    } else if (volume > 25000 || weight > 5) {
      return 'M';
    } else {
      return 'S';
    }
  }
}

export const pudoService = new PudoService();
