import { useState, useEffect } from 'react';
import { useAddOrUpdateHouse, useActorStatus } from '../hooks/useQueries';
import { useActorWithRetry } from '../hooks/useActorWithRetry';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import type { SerializableHouse } from '../lib/bigIntUtils';

interface AddHouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house: SerializableHouse | null;
}

export default function AddHouseDialog({ open, onOpenChange, house }: AddHouseDialogProps) {
  const [name, setName] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTermYears, setLoanTermYears] = useState('');
  const [downPayment, setDownPayment] = useState('');
  
  const addOrUpdateHouse = useAddOrUpdateHouse();
  const { isActorReady, isConnecting, showRetryPrompt, isOnline, retryAttempt, maxRetries } = useActorStatus();
  const { manualRetry } = useActorWithRetry();

  useEffect(() => {
    if (open && house) {
      setName(house.name);
      setTotalCost(house.totalCost.toString());
      setInterestRate(house.interestRate.toString());
      setLoanTermYears(house.loanTermYears.toString());
      setDownPayment(house.downPayment.toString());
    } else if (open && !house) {
      setName('');
      setTotalCost('');
      setInterestRate('0');
      setLoanTermYears('30');
      setDownPayment('0');
    }
  }, [open, house]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = parseFloat(totalCost);
    const rateNum = parseFloat(interestRate);
    const loanTermNum = parseInt(loanTermYears);
    const downPaymentNum = parseFloat(downPayment);
    
    if (name.trim() && costNum > 0 && rateNum >= 0 && loanTermNum > 0 && downPaymentNum >= 0) {
      const houseData: SerializableHouse = {
        id: house?.id || `house-${Date.now()}`,
        name: name.trim(),
        totalCost: costNum,
        interestRate: rateNum,
        loanTermYears: loanTermNum,
        downPayment: downPaymentNum,
        createdAt: house?.createdAt || Date.now() * 1000000,
      };

      addOrUpdateHouse.mutate(houseData, {
        onSuccess: () => {
          setName('');
          setTotalCost('');
          setInterestRate('0');
          setLoanTermYears('30');
          setDownPayment('0');
          onOpenChange(false);
        },
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
      setTotalCost('');
      setInterestRate('0');
      setLoanTermYears('30');
      setDownPayment('0');
    }
    onOpenChange(newOpen);
  };

  const isUpdate = !!house;
  const isFormValid = name.trim() && 
    totalCost && parseFloat(totalCost) > 0 && 
    interestRate && parseFloat(interestRate) >= 0 && 
    loanTermYears && parseInt(loanTermYears) > 0 && 
    downPayment && parseFloat(downPayment) >= 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Edit' : 'Add'} House</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? 'Update the details of your house.'
              : 'Add a new house to track payments.'}
          </DialogDescription>
        </DialogHeader>

        {/* Connection Status Alerts */}
        <div className="space-y-2">
          {!isOnline && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
                You're offline. House will be saved locally and synced automatically when connection is restored.
              </AlertDescription>
            </Alert>
          )}
          
          {isOnline && isConnecting && (
            <Alert variant="default" className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-500 animate-spin" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                {retryAttempt > 0 
                  ? `Connecting... (attempt ${retryAttempt}/${maxRetries})`
                  : 'Connecting to backend...'
                }
                {' '}House will be saved locally and synced automatically once connected.
              </AlertDescription>
            </Alert>
          )}
          
          {isOnline && showRetryPrompt && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-2">
                <p>Backend connection unavailable after multiple attempts. House will be saved locally and synced when connection is restored.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={manualRetry}
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Connection
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isOnline && isActorReady && (
            <Alert variant="default" className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <Wifi className="h-4 w-4 text-green-600 dark:text-green-500" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-300">
                Connected. House will be saved immediately.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">House Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Main Residence, Vacation Home"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalCost">Total Cost *</Label>
            <Input
              id="totalCost"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="downPayment">Down Payment *</Label>
            <Input
              id="downPayment"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (%) *</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loanTermYears">Loan Term (Years) *</Label>
            <Input
              id="loanTermYears"
              type="number"
              step="1"
              min="1"
              placeholder="30"
              value={loanTermYears}
              onChange={(e) => setLoanTermYears(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={addOrUpdateHouse.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || addOrUpdateHouse.isPending}
            >
              {addOrUpdateHouse.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isUpdate ? 'Update' : 'Add House'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
