import { useState, useMemo, lazy, Suspense } from 'react';
import { useGetAllHousesWithProgress, useGetDashboardSummary } from '../hooks/useQueries';
import LoadingAnimation from '../components/LoadingAnimation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Home, ArrowUpDown, Filter } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

// Lazy load non-critical components for memory efficiency
const DashboardSummary = lazy(() => import('../components/DashboardSummary'));
const AddHouseDialog = lazy(() => import('../components/AddHouseDialog'));

type SortOption = 'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'balance-asc' | 'balance-desc' | 'cost-asc' | 'cost-desc';
type FilterOption = 'all' | '0-25' | '25-50' | '50-75' | '75-100';

export default function HousesOverview() {
  const { data: housesWithProgress, isLoading: housesLoading } = useGetAllHousesWithProgress();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const [showAddHouse, setShowAddHouse] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getProgressBadge = (progress: number) => {
    if (progress < 25) return { variant: 'destructive' as const, label: 'Just Started' };
    if (progress < 50) return { variant: 'secondary' as const, label: 'In Progress' };
    if (progress < 75) return { variant: 'default' as const, label: 'Good Progress' };
    return { variant: 'default' as const, label: 'Almost Done' };
  };

  const filteredAndSortedHouses = useMemo(() => {
    if (!housesWithProgress) return [];

    let filtered = housesWithProgress.filter(house => {
      const progress = house.progressPercentage;
      switch (filterBy) {
        case '0-25': return progress < 25;
        case '25-50': return progress >= 25 && progress < 50;
        case '50-75': return progress >= 50 && progress < 75;
        case '75-100': return progress >= 75;
        default: return true;
      }
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.house.name.localeCompare(b.house.name);
        case 'name-desc':
          return b.house.name.localeCompare(a.house.name);
        case 'progress-asc':
          return a.progressPercentage - b.progressPercentage;
        case 'progress-desc':
          return b.progressPercentage - a.progressPercentage;
        case 'balance-asc':
          return a.remainingBalance - b.remainingBalance;
        case 'balance-desc':
          return b.remainingBalance - a.remainingBalance;
        case 'cost-asc':
          return a.house.totalCost - b.house.totalCost;
        case 'cost-desc':
          return b.house.totalCost - a.house.totalCost;
        default:
          return 0;
      }
    });
  }, [housesWithProgress, sortBy, filterBy]);

  if (summaryLoading || housesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingAnimation message="Loading your houses..." step="Preparing Dashboard..." />
      </div>
    );
  }

  if (!housesWithProgress || housesWithProgress.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary">
            <Home className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome to Your House Payment Tracker</h2>
          <p className="text-muted-foreground mb-8">
            Let's get started by adding your first house. Enter the house details including cost, down payment, interest rate, and loan term to begin tracking your payments.
          </p>
          <Button onClick={() => setShowAddHouse(true)} size="lg">
            <Home className="mr-2 h-5 w-5" />
            Add Your First House
          </Button>
          <Suspense fallback={null}>
            {showAddHouse && (
              <AddHouseDialog
                open={showAddHouse}
                onOpenChange={setShowAddHouse}
                house={null}
              />
            )}
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Houses Overview</h1>
          <p className="text-muted-foreground">Manage and track all your properties in one place</p>
        </div>
        <Button onClick={() => setShowAddHouse(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add House
        </Button>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center"><LoadingAnimation message="Loading summary..." step="Loading data..." /></div>}>
        <DashboardSummary summary={summary} />
      </Suspense>

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="progress-asc">Progress (Low to High)</SelectItem>
                <SelectItem value="progress-desc">Progress (High to Low)</SelectItem>
                <SelectItem value="balance-asc">Balance (Low to High)</SelectItem>
                <SelectItem value="balance-desc">Balance (High to Low)</SelectItem>
                <SelectItem value="cost-asc">Cost (Low to High)</SelectItem>
                <SelectItem value="cost-desc">Cost (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            </div>
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                <SelectItem value="0-25">0-25% Complete</SelectItem>
                <SelectItem value="25-50">25-50% Complete</SelectItem>
                <SelectItem value="50-75">50-75% Complete</SelectItem>
                <SelectItem value="75-100">75-100% Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedHouses.map((houseData) => {
            const { house, totalPaid, remainingBalance, progressPercentage } = houseData;
            const progressBadge = getProgressBadge(progressPercentage);

            return (
              <Card 
                key={house.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate({ to: '/house/$houseId', params: { houseId: house.id } })}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{house.name}</CardTitle>
                    <Badge variant={progressBadge.variant}>{progressBadge.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Cost</span>
                      <span className="font-semibold">{formatCurrency(house.totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Down Payment</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(house.downPayment)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Loan Term</span>
                      <span className="font-semibold">{house.loanTermYears} years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Interest Rate</span>
                      <span className="font-semibold">{house.interestRate.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(remainingBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-semibold text-primary">{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({ to: '/house/$houseId', params: { houseId: house.id } });
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAndSortedHouses.length === 0 && housesWithProgress.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No houses match the selected filter.</p>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showAddHouse && (
          <AddHouseDialog
            open={showAddHouse}
            onOpenChange={setShowAddHouse}
            house={null}
          />
        )}
      </Suspense>
    </div>
  );
}
