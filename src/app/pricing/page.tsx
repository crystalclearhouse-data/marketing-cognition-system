import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

export default function PricingPage() {
  const features = {
    free: [
      { text: "Up to 10 tracks", included: true },
      { text: "Create playlists", included: true },
      { text: "Basic Discord bot access", included: true },
      { text: "Community features", included: true },
      { text: "Ads supported", included: false },
      { text: "Unlimited uploads", included: false },
      { text: "Priority bot hosting", included: false },
      { text: "Ad-free experience", included: false },
    ],
    premium: [
      { text: "Unlimited tracks", included: true },
      { text: "Unlimited playlists", included: true },
      { text: "Priority Discord bot hosting", included: true },
      { text: "Advanced bot features", included: true },
      { text: "Ad-free experience", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to new features", included: true },
      { text: "Custom playlist themes", included: true },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Start free, upgrade when you're ready
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        {/* Free Tier */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  {feature.included ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={
                      feature.included ? "" : "text-muted-foreground"
                    }
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/auth/signin" className="mt-6 block">
              <Button variant="outline" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Premium Tier */}
        <Card className="relative border-primary shadow-lg">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
            POPULAR
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <CardDescription>For serious music communities</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$9</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <form action="/api/stripe/create-checkout" method="POST" className="mt-6">
              <Button className="w-full">
                Upgrade to Premium
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">Can I switch plans anytime?</h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit cards through Stripe, including Visa, Mastercard, and American Express.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Is there a refund policy?</h3>
            <p className="text-muted-foreground">
              Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact us for a full refund.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">What happens to my tracks if I downgrade?</h3>
            <p className="text-muted-foreground">
              Your existing tracks remain accessible, but you won't be able to upload new ones until you're back within the free tier limit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
