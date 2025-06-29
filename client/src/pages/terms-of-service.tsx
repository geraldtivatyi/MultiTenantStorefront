import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useTenant } from "@/hooks/use-tenant";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, CreditCard, Truck, RotateCcw, AlertTriangle } from "lucide-react";

export function TermsOfService() {
  const { data: tenant, isLoading } = useTenant();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-primary-brand/10 rounded-full flex items-center justify-center">
                  <Scale className="h-8 w-8 text-primary-brand" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Terms of Service
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                These terms govern your use of {tenant?.name || "Creative Crafts Studio"} and 
                outline the rights and responsibilities of both parties.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Last updated: December 2024
              </p>
            </>
          )}
        </div>

        <div className="space-y-8">
          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                By accessing and using our website, placing orders, or creating an account, 
                you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                If you do not agree with any of these terms, you are prohibited from using our services.
              </p>
              <p className="text-muted-foreground">
                We reserve the right to update these terms at any time without prior notice. 
                Your continued use of our services following any changes constitutes acceptance of those changes.
              </p>
            </CardContent>
          </Card>

          {/* Use of Website */}
          <Card>
            <CardHeader>
              <CardTitle>Use of Website and Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Permitted Use</h3>
                <p className="text-muted-foreground mb-2">You may use our website to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Browse and purchase products for personal or commercial use</li>
                  <li>Create and manage your account</li>
                  <li>Access customer support services</li>
                  <li>Subscribe to our newsletter and marketing communications</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Prohibited Activities</h3>
                <p className="text-muted-foreground mb-2">You agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Use the website for any unlawful purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt our services</li>
                  <li>Use automated tools to access our website without permission</li>
                  <li>Submit false or misleading information</li>
                  <li>Violate any applicable local, state, or international law</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Orders and Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Orders and Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Order Process</h3>
                <p className="text-muted-foreground">
                  When you place an order, you are making an offer to purchase products at the 
                  stated price. We reserve the right to accept or decline your order for any reason. 
                  Orders are confirmed when payment is successfully processed.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Pricing and Payment</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>All prices are listed in South African Rand (ZAR)</li>
                  <li>Prices are subject to change without notice</li>
                  <li>Payment is processed securely through Paystack</li>
                  <li>We accept major credit cards, bank transfers, and mobile money</li>
                  <li>All sales are final unless otherwise specified</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Product Availability</h3>
                <p className="text-muted-foreground">
                  Product availability is subject to change. If an item becomes unavailable after 
                  you place an order, we will notify you and offer a refund or suitable alternative.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping and Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Shipping and Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Shipping Policy</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>We ship to addresses within South Africa</li>
                  <li>Standard delivery takes 3-7 business days</li>
                  <li>Express delivery available for additional cost</li>
                  <li>Free shipping on orders over R500</li>
                  <li>Shipping costs calculated at checkout</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Delivery</h3>
                <p className="text-muted-foreground">
                  Delivery times are estimates and may vary due to unforeseen circumstances. 
                  We are not responsible for delays caused by shipping carriers, customs, 
                  or events beyond our control.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Risk of Loss</h3>
                <p className="text-muted-foreground">
                  Risk of loss and title for products pass to you upon delivery to the 
                  shipping carrier. We recommend purchasing shipping insurance for valuable orders.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Returns and Refunds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RotateCcw className="h-5 w-5 mr-2" />
                Returns and Refunds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Return Policy</h3>
                <p className="text-muted-foreground mb-2">
                  We accept returns within 30 days of delivery for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Unused items in original packaging</li>
                  <li>Items in sellable condition</li>
                  <li>Defective or damaged products</li>
                  <li>Items that don't match description</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Non-Returnable Items</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Personalized or custom-made items</li>
                  <li>Perishable goods or consumables</li>
                  <li>Digital downloads</li>
                  <li>Items marked as final sale</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Refund Process</h3>
                <p className="text-muted-foreground">
                  Approved refunds will be processed within 5-10 business days to your 
                  original payment method. Return shipping costs are the customer's 
                  responsibility unless the item was defective or incorrectly shipped.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                All content on our website, including text, graphics, logos, images, and software, 
                is the property of Creative Crafts Studio or our content suppliers and is protected 
                by South African and international copyright laws.
              </p>
              <p className="text-muted-foreground">
                You may not reproduce, distribute, display, or create derivative works from 
                any content without our express written permission.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Creative Crafts Studio shall not be 
                liable for any indirect, incidental, special, consequential, or punitive damages, 
                including but not limited to loss of profits, data, or use.
              </p>
              <p className="text-muted-foreground">
                Our total liability to you for any claims arising from these terms or your 
                use of our services shall not exceed the amount you paid for the specific 
                product or service giving rise to the claim.
              </p>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your privacy is important to us. Please review our Privacy Policy, which 
                explains how we collect, use, and protect your information when you use our services.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                These Terms of Service are governed by and construed in accordance with the 
                laws of South Africa. Any disputes arising from these terms will be resolved 
                in the courts of South Africa.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> legal@creativecrafts.co.za
                </p>
                <p className="text-muted-foreground">
                  <strong>Phone:</strong> +27 11 123 4567
                </p>
                <p className="text-muted-foreground">
                  <strong>Address:</strong> 123 Arts District, Cape Town, 8001, South Africa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}