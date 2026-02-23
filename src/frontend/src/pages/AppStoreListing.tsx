import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Home, TrendingUp, History, Shield, DollarSign, BarChart3 } from 'lucide-react';

export default function AppStoreListing() {
  const keywords = [
    'mortgage',
    'finance',
    'payments',
    'home loans',
    'tracker',
    'property management',
    'real estate',
    'debt payoff',
    'financial planning',
    'homeowner tools',
    'loan calculator',
    'interest tracking',
    'payment history',
    'home finance',
    'mortgage calculator',
  ];

  const screenshots = [
    {
      title: 'Houses Overview Dashboard',
      description: 'View all your properties at a glance with progress indicators, remaining balances, and key metrics for each house.',
      icon: Home,
    },
    {
      title: 'Individual House Dashboard',
      description: 'Track detailed progress for each property with visual charts showing total paid, remaining balance, and interest calculations.',
      icon: BarChart3,
    },
    {
      title: 'Payment History & Recording',
      description: 'Log every payment with dates, amounts, and notes. Edit or delete entries as needed with a clean, organized interface.',
      icon: History,
    },
    {
      title: 'Add & Edit House Information',
      description: 'Easily input house details including total cost, down payment, interest rate, and loan term with intuitive forms.',
      icon: DollarSign,
    },
    {
      title: 'Progress Tracking & Analytics',
      description: 'Monitor your journey to homeownership with real-time progress percentages and interest-adjusted calculations.',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 shadow-lg">
            <img 
              src="/assets/generated/house-loading-icon-transparent.dim_64x64.png" 
              alt="Mortgage Tracker" 
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Mortgage Tracker
          </h1>
          <p className="text-xl text-muted-foreground">
            App Store Listing Materials
          </p>
        </div>

        {/* App Description */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              App Description
            </CardTitle>
            <CardDescription>
              Beginner-friendly overview for potential users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-base leading-relaxed">
                <strong>Take control of your home ownership journey with Mortgage Tracker!</strong>
              </p>
              <p className="text-base leading-relaxed">
                Whether you own one property or manage multiple homes, Mortgage Tracker makes it easy to stay on top of your mortgage payments and watch your progress toward full ownership. Our friendly, intuitive app helps you visualize exactly where you stand with each property.
              </p>
              <p className="text-base leading-relaxed">
                <strong>What makes Mortgage Tracker special?</strong>
              </p>
              <ul className="space-y-2 text-base">
                <li><strong>Manage Multiple Properties:</strong> Track as many houses as you own, all in one convenient place.</li>
                <li><strong>Smart Interest Calculations:</strong> Automatically factors in interest rates and down payments for accurate financial tracking.</li>
                <li><strong>Visual Progress Tracking:</strong> See your payoff progress with beautiful charts and percentage indicators that update in real-time.</li>
                <li><strong>Complete Payment History:</strong> Log every payment with dates, amounts, and personal notes. Edit or delete entries anytime.</li>
                <li><strong>Secure & Private:</strong> Your financial data is protected with blockchain-level security on the Internet Computer.</li>
                <li><strong>User-Friendly Interface:</strong> Designed for everyone, from first-time homebuyers to experienced property investors.</li>
              </ul>
              <p className="text-base leading-relaxed">
                <strong>Perfect for:</strong> First-time homeowners, real estate investors, anyone paying off a mortgage, financial planners, and families managing home finances together.
              </p>
              <p className="text-base leading-relaxed">
                Start your journey to mortgage freedom today. Download Mortgage Tracker and celebrate every payment milestone!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Keywords Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Recommended Keywords
            </CardTitle>
            <CardDescription>
              Optimize discoverability in app stores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-sm px-3 py-1.5 hover:bg-primary/20 transition-colors"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">
              <strong>Primary Keywords:</strong> mortgage, finance, payments, home loans, tracker
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Secondary Keywords:</strong> property management, real estate, debt payoff, financial planning, homeowner tools
            </p>
          </CardContent>
        </Card>

        {/* Screenshot Placeholders */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Screenshot Layout Guide
            </CardTitle>
            <CardDescription>
              Recommended screenshots to showcase key features (3-5 screens)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <screenshot.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        Screenshot {index + 1}: {screenshot.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {screenshot.description}
                      </p>
                      <div className="mt-4 bg-muted/30 border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          [Screenshot Placeholder - {screenshot.title}]
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Recommended size: 1242 x 2688 pixels (iPhone) or 1080 x 1920 pixels (Android)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Screenshot Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Use actual app screens with sample data that looks realistic</li>
                <li>Highlight key features with subtle annotations or callouts</li>
                <li>Show the app in both light and dark modes if applicable</li>
                <li>Include diverse use cases (single property vs. multiple properties)</li>
                <li>Ensure text is readable and UI elements are clearly visible</li>
                <li>Maintain consistent branding and color scheme across all screenshots</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>App Content Language: <strong>English</strong></p>
          <p className="mt-2">Target Audience: Homeowners, Real Estate Investors, Financial Planners</p>
          <p className="mt-2">Category: Finance, Productivity, Utilities</p>
        </div>
      </div>
    </div>
  );
}
