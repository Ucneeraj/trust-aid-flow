import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Heart, Shield, Eye, TrendingUp, Users, ArrowRight } from "lucide-react";

export default function Index() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(180_60%_25%/0.08),transparent_50%)]" />
        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Shield className="h-4 w-4" />
              100% Transparent Fund Tracking
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              See Where Every
              <span className="text-primary"> Dollar</span> Goes
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with verified NGOs, donate with confidence, and track exactly how your contributions create real impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild variant="hero" size="xl">
                <Link to="/auth?mode=signup">
                  Start Donating <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="hero-outline" size="xl">
                <Link to="/projects">Browse Projects</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Transparency
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every transaction is recorded, every expense is documented, and every milestone is tracked.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: "Full Visibility",
                description: "Track every expense with receipts, invoices, and timestamps. Nothing is hidden.",
              },
              {
                icon: Shield,
                title: "Verified NGOs",
                description: "All organizations are vetted and approved before they can receive donations.",
              },
              {
                icon: TrendingUp,
                title: "Real-time Updates",
                description: "Watch projects progress with milestone tracking and regular updates from NGOs.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-primary">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <Heart className="h-12 w-12 text-primary-foreground mx-auto animate-float" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Join thousands of donors who trust TransFund for transparent giving.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="xl" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth?mode=signup">Create Account</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/auth?mode=signup&role=ngo">Register as NGO</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
