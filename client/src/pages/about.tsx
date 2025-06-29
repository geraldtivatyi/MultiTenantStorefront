import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useTenant } from "@/hooks/use-tenant";
import { Heart, Users, Award, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function About() {
  const { data: tenant, isLoading } = useTenant();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                About {tenant?.name || "Our Store"}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Bringing creativity and inspiration to artists and crafters worldwide through 
                high-quality materials and passionate expertise.
              </p>
            </>
          )}
        </div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Founded in 2020, Creative Crafts Studio began as a small passion project 
                between two friends who shared a love for handmade arts and crafts. What 
                started in a garage workshop has grown into a trusted destination for 
                creative minds seeking quality materials and inspiration.
              </p>
              <p>
                We believe that creativity knows no bounds, and everyone deserves access 
                to the tools and materials needed to bring their artistic visions to life. 
                From professional artists to weekend hobbyists, we serve a diverse community 
                united by the joy of creating.
              </p>
              <p>
                Today, we're proud to offer over 500 premium crafting products, from 
                traditional art supplies to innovative crafting tools, all carefully 
                curated to meet the needs of our creative community.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div 
              className="h-64 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')"
              }}
            />
            <div 
              className="h-48 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300')"
              }}
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary-brand" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Passion</h3>
              <p className="text-muted-foreground">
                We're passionate about crafting and committed to helping others discover 
                the joy of creating with their hands.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary-brand" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Quality</h3>
              <p className="text-muted-foreground">
                Every product is carefully selected and tested to ensure it meets our 
                high standards for quality and durability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-brand" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Community</h3>
              <p className="text-muted-foreground">
                We're more than a store – we're a community of creators supporting 
                each other's artistic journeys.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-primary-brand" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Service</h3>
              <p className="text-muted-foreground">
                Fast shipping, easy returns, and friendly customer support make 
                shopping with us a pleasure.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-primary-brand to-purple-600 rounded-lg p-8 text-white">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-lg opacity-90">Products</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">10k+</div>
              <div className="text-lg opacity-90">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">50k+</div>
              <div className="text-lg opacity-90">Orders Shipped</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">99%</div>
              <div className="text-lg opacity-90">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}