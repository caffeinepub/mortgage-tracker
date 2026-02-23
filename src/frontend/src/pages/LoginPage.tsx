import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '../components/ui/button';
import { Shield, TrendingUp, History, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <img 
                src="/assets/generated/house-loading-icon-transparent.dim_64x64.png" 
                alt="Mortgage Tracker" 
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Mortgage Tracker
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Take control of your home ownership journey. Track payments, monitor progress, and celebrate milestones.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Visualize your payment progress with real-time calculations and percentage tracking.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Payment History</h3>
              <p className="text-sm text-muted-foreground">
                Keep a detailed log of every payment with dates and notes for your records.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your financial data is stored securely with blockchain-based authentication.
              </p>
            </div>
          </div>

          {/* Login Section */}
          <Card className="shadow-xl max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">
                Sign in securely using Internet Identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Internet Identity provides secure, passwordless authentication powered by the Internet Computer blockchain.
                  </p>
                  <Button
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    size="lg"
                    className="w-full"
                  >
                    <Fingerprint className="w-5 h-5 mr-2" />
                    {isLoggingIn ? 'Signing in...' : 'Sign In with Internet Identity'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
