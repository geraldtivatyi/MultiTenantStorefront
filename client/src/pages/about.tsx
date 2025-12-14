import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { Heart, Users, Award, Truck, LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to get icon component by name
function getIconComponent(iconName?: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    heart: Heart,
    users: Users,
    award: Award,
    truck: Truck,
  };
  return iconMap[iconName?.toLowerCase() || ''] || Heart;
}

// Default values for fallback
const defaultValues = [
  {
    title: "Style",
    description: "We're passionate about fashion and committed to helping you express your unique style.",
    icon: "heart"
  },
  {
    title: "Quality",
    description: "Every garment is carefully selected to ensure it meets our high standards for quality and comfort.",
    icon: "award"
  },
  {
    title: "Trends",
    description: "Stay ahead of fashion trends with our curated collection of the latest styles.",
    icon: "users"
  },
  {
    title: "Service",
    description: "Fast shipping, easy returns, and friendly customer support make shopping with us a pleasure.",
    icon: "truck"
  }
];

const defaultStats = {
  products: "500+",
  customers: "10k+",
  orders: "50k+",
  satisfaction: "99%"
};

const defaultImages = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300'
];

export function About() {
  const { data: storeSettings, isLoading } = useStoreSettings();
  
  // Get store data with fallbacks
  const aboutStory = storeSettings?.aboutStory || "Welcome to M Blessings! We're dedicated to providing quality products and excellent service to our valued customers.";
  const aboutValues = storeSettings?.aboutValues && Array.isArray(storeSettings.aboutValues) && storeSettings.aboutValues.length > 0 
    ? storeSettings.aboutValues 
    : defaultValues;
  const aboutStats = storeSettings?.aboutStats || defaultStats;
  const aboutImages = storeSettings?.aboutImages && Array.isArray(storeSettings.aboutImages) && storeSettings.aboutImages.length > 0
    ? storeSettings.aboutImages
    : defaultImages;

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
                About {storeSettings?.name || "Our Store"}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {storeSettings?.description || "Welcome to M Blessings! We're dedicated to providing quality products and excellent service to our valued customers."}
              </p>
            </>
          )}
        </div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              {aboutStory.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {aboutImages.map((imageUrl, index) => (
              <div 
                key={index}
                className={`bg-cover bg-center rounded-lg ${index === 0 ? 'h-64' : 'h-48'}`}
                style={{
                  backgroundImage: `url('${imageUrl}')`
                }}
              />
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
          <div className={`grid md:grid-cols-2 ${aboutValues.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-8`}>
            {aboutValues.map((value, index) => {
              const IconComponent = getIconComponent(value.icon);
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-primary-brand" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        {aboutStats && (
          <div className="bg-gradient-to-r from-primary-brand to-purple-600 rounded-lg p-8 text-white">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {aboutStats.products && (
                <div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{aboutStats.products}</div>
                  <div className="text-lg opacity-90">Products</div>
                </div>
              )}
              {aboutStats.customers && (
                <div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{aboutStats.customers}</div>
                  <div className="text-lg opacity-90">Happy Customers</div>
                </div>
              )}
              {aboutStats.orders && (
                <div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{aboutStats.orders}</div>
                  <div className="text-lg opacity-90">Orders Shipped</div>
                </div>
              )}
              {aboutStats.satisfaction && (
                <div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{aboutStats.satisfaction}</div>
                  <div className="text-lg opacity-90">Customer Satisfaction</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}