import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, MapPin, Package, Calculator, Shield, AlertCircle } from "lucide-react";

export function ShippingInfo() {

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary-brand/10 rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-primary-brand" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Shipping Information
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Fast, reliable delivery across South Africa. Get your fashion items when you need them.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Shipping Options */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Shipping Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Standard Shipping */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Standard Delivery</h3>
                    <Badge variant="secondary">Most Popular</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>3-7 business days</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calculator className="h-4 w-4 mr-2" />
                      <span>R45-R85 (free over R500)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reliable delivery with tracking. Perfect for regular orders.
                    </p>
                  </div>
                </div>

                {/* Express Shipping */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Express Delivery</h3>
                    <Badge variant="default">Fast</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>1-2 business days</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calculator className="h-4 w-4 mr-2" />
                      <span>R95-R150</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Priority handling for urgent orders and special occasions.
                    </p>
                  </div>
                </div>

                {/* Same Day (Cape Town/Johannesburg) */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Same Day Delivery</h3>
                    <Badge>Cape Town & Johannesburg</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Within 6 hours</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calculator className="h-4 w-4 mr-2" />
                      <span>R200-R350</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Emergency delivery for last-minute fashion needs. Order by 2 PM.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Major Cities</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Full service with all delivery options available:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">• Cape Town</div>
                    <div className="text-sm text-muted-foreground">• Johannesburg</div>
                    <div className="text-sm text-muted-foreground">• Durban</div>
                    <div className="text-sm text-muted-foreground">• Pretoria</div>
                    <div className="text-sm text-muted-foreground">• Port Elizabeth</div>
                    <div className="text-sm text-muted-foreground">• Bloemfontein</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Smaller Towns</h3>
                  <p className="text-muted-foreground text-sm">
                    Standard delivery available nationwide. Express delivery to most towns with courier services.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Remote Areas</h3>
                  <p className="text-muted-foreground text-sm">
                    We deliver anywhere with a postal address. Extended delivery times may apply (7-14 days).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipping Policies */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Shipping Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Free Shipping Threshold</h3>
                  <p className="text-muted-foreground text-sm">
                    Enjoy free standard delivery on orders over R500. No minimum for premium members.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Processing Time</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>In-stock items: 1-2 business days</li>
                    <li>Custom/made-to-order: 3-5 business days</li>
                    <li>Bulk orders (50+ items): 2-4 business days</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Order Tracking</h3>
                  <p className="text-muted-foreground text-sm">
                    All orders include tracking information sent via email and SMS. 
                    Track your package in real-time through our website or the courier's portal.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Delivery Confirmation</h3>
                  <p className="text-muted-foreground text-sm">
                    Signature required for orders over R1000. Safe-drop available for regular customers.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Shipping Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Shipping costs are calculated based on:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Package weight and dimensions</li>
                    <li>Delivery location and distance</li>
                    <li>Selected delivery speed</li>
                    <li>Special handling requirements</li>
                  </ul>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">Example Costs:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Small package (Cape Town)</span>
                        <span className="font-medium">R45</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Medium package (Johannesburg)</span>
                        <span className="font-medium">R65</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Large package (Durban)</span>
                        <span className="font-medium">R85</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Delivery Delays</h3>
                  <p className="text-muted-foreground text-sm">
                    Delays may occur during peak seasons (holidays), severe weather, 
                    or due to courier service disruptions. We'll keep you informed of any changes.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Address Accuracy</h3>
                  <p className="text-muted-foreground text-sm">
                    Please ensure your delivery address is complete and accurate. 
                    Incorrect addresses may result in delivery delays and additional charges.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">International Shipping</h3>
                  <p className="text-muted-foreground text-sm">
                    Currently shipping within South Africa only. International shipping 
                    coming soon. Contact us for special arrangements.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Damaged Packages</h3>
                  <p className="text-muted-foreground text-sm">
                    Report damaged packages within 48 hours of delivery. 
                    We'll arrange replacement or refund for damaged items.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Shipping FAQ
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Can I change my delivery address after ordering?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Yes, if your order hasn't been processed yet. Contact us immediately 
                  with your order number and new address.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  What if I miss my delivery?
                </h3>
                <p className="text-muted-foreground text-sm">
                  The courier will leave a card with redelivery instructions. 
                  Most couriers attempt delivery 2-3 times before returning to depot.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Do you deliver on weekends?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Saturday delivery available for express orders at additional cost. 
                  No Sunday deliveries except for emergency same-day service.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Can I specify a delivery time?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Standard delivery is between 8 AM - 6 PM. Time slots available 
                  for express delivery at additional cost.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}