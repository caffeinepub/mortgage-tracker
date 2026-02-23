import { useState, lazy, Suspense, useEffect } from 'react';
import { useGetAllHouses, useGetPaymentHistoryByHouse, useGetHouseProgress } from '../hooks/useQueries';
import LoadingAnimation from '../components/LoadingAnimation';
import { Button } from '../components/ui/button';
import { Plus, Home, ArrowLeft, Trash2 } from 'lucide-react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb';
import { Skeleton } from '../components/ui/skeleton';
import DeleteHouseDialog from '../components/DeleteHouseDialog';

// Lazy load non-critical components
const PaymentHistory = lazy(() => import('../components/PaymentHistory'));
const AddPaymentDialog = lazy(() => import('../components/AddPaymentDialog'));
const AddHouseDialog = lazy(() => import('../components/AddHouseDialog'));

export default function Dashboard() {
  const { houseId } = useParams({ from: '/house/$houseId' });
  const navigate = useNavigate();
  const { data: houses, isLoading: housesLoading } = useGetAllHouses();
  const { data: payments, isLoading: paymentsLoading } = useGetPaymentHistoryByHouse(houseId);
  const { data: houseProgress } = useGetHouseProgress(houseId);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddHouse, setShowAddHouse] = useState(false);
  const [showDeleteHouse, setShowDeleteHouse] = useState(false);

  const selectedHouse = houses?.find(h => h.id === houseId);

  // Smooth scroll to top when houseId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [houseId]);

  const handleDeleteSuccess = () => {
    navigate({ to: '/' });
  };

  if (housesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 overflow-x-hidden">
        <LoadingAnimation message="Loading house details..." />
      </div>
    );
  }

  if (!selectedHouse) {
    navigate({ to: '/' });
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 max-w-full">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => navigate({ to: '/' })}
                  className="cursor-pointer"
                >
                  Houses Overview
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedHouse.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate({ to: '/' })}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold mb-2 break-words">{selectedHouse.name}</h1>
              <p className="text-muted-foreground">Track payments and monitor progress</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteHouse(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete House
            </Button>
            <Button variant="outline" onClick={() => setShowAddHouse(true)}>
              <Home className="mr-2 h-4 w-4" />
              Edit House
            </Button>
            <Button onClick={() => setShowAddPayment(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </div>
        </div>

        {selectedHouse && houseProgress && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
              <p className="text-2xl font-bold break-words">
                ${selectedHouse.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Down Payment</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 break-words">
                ${houseProgress.downPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
              <p className="text-2xl font-bold break-words">
                ${(selectedHouse.totalCost - houseProgress.downPayment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Interest Rate</p>
              <p className="text-2xl font-bold">{selectedHouse.interestRate.toFixed(2)}%</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Loan Term</p>
              <p className="text-2xl font-bold">{selectedHouse.loanTermYears} years</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Total with Interest</p>
              <p className="text-2xl font-bold break-words">
                ${houseProgress.totalLoanAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 break-words">
                ${houseProgress.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Remaining Balance</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 break-words">
                ${houseProgress.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-1">Progress</p>
              <p className="text-2xl font-bold text-primary">
                {houseProgress.progressPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        <Suspense fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }>
          {paymentsLoading ? (
            <LoadingAnimation message="Loading payment history..." />
          ) : (
            <PaymentHistory 
              payments={payments || []} 
              isLoading={paymentsLoading}
              houseName={selectedHouse?.name || ''}
              houseId={houseId}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {showAddPayment && (
            <AddPaymentDialog 
              open={showAddPayment} 
              onOpenChange={setShowAddPayment}
              houseId={houseId}
              houseName={selectedHouse?.name || ''}
            />
          )}
          {showAddHouse && (
            <AddHouseDialog
              open={showAddHouse}
              onOpenChange={setShowAddHouse}
              house={selectedHouse || null}
            />
          )}
          {showDeleteHouse && (
            <DeleteHouseDialog
              open={showDeleteHouse}
              onOpenChange={setShowDeleteHouse}
              houseId={houseId}
              houseName={selectedHouse?.name || ''}
              onDeleteSuccess={handleDeleteSuccess}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
