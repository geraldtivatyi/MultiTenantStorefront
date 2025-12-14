import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Contact() {
  const { data: storeSettings, isLoading } = useStoreSettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get store contact info with fallbacks
  const contactEmail = storeSettings?.contactEmail || "hello@example.com";
  const contactPhone = storeSettings?.contactPhone || "+27 11 123 4567";
  const contactAddress = storeSettings?.contactAddress || storeSettings?.address || "123 Main Street\nCity, 0000\nSouth Africa";
  
  // Default store hours
  const defaultStoreHours = {
    monday: "9:00 AM - 6:00 PM",
    tuesday: "9:00 AM - 6:00 PM",
    wednesday: "9:00 AM - 6:00 PM",
    thursday: "9:00 AM - 6:00 PM",
    friday: "9:00 AM - 6:00 PM",
    saturday: "10:00 AM - 4:00 PM",
    sunday: "Closed"
  };
  
  const storeHours = storeSettings?.storeHours || defaultStoreHours;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to send your message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "We'll get back to you within 24 hours.",
        });

        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again later or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Contact {storeSettings?.name || "Us"}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Have a question about our products? Need help with your order? 
                We're here to help and would love to hear from you.
              </p>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send us a message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="What's this about?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-brand/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-primary-brand" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Email</h3>
                    <p className="text-muted-foreground">{contactEmail}</p>
                    <p className="text-sm text-muted-foreground">We'll respond within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-brand/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-primary-brand" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Phone</h3>
                    <p className="text-muted-foreground">{contactPhone}</p>
                    <p className="text-sm text-muted-foreground">Mon-Fri 9AM-5PM SAST</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-brand/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary-brand" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Address</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {contactAddress}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Store Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {storeHours.monday && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday</span>
                      <span className="font-medium">{storeHours.monday}</span>
                    </div>
                  )}
                  {storeHours.tuesday && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tuesday</span>
                      <span className="font-medium">{storeHours.tuesday}</span>
                    </div>
                  )}
                  {storeHours.wednesday && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wednesday</span>
                      <span className="font-medium">{storeHours.wednesday}</span>
                    </div>
                  )}
                  {storeHours.thursday && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thursday</span>
                      <span className="font-medium">{storeHours.thursday}</span>
                    </div>
                  )}
                  {storeHours.friday && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Friday</span>
                      <span className="font-medium">{storeHours.friday}</span>
                    </div>
                  )}
                  {storeHours.saturday && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="font-medium">{storeHours.saturday}</span>
                    </div>
                  )}
                  {storeHours.sunday && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sunday</span>
                      <span className="font-medium">{storeHours.sunday}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Help</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground">Shipping Questions?</h4>
                    <p className="text-sm text-muted-foreground">
                      Most orders ship within 1-2 business days. Free shipping on orders over R500.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Returns & Exchanges</h4>
                    <p className="text-sm text-muted-foreground">
                      30-day return policy on all unused items in original packaging.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Product Questions?</h4>
                    <p className="text-sm text-muted-foreground">
                      Our fashion experts are here to help you find the perfect style.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}