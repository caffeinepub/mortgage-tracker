import { useDeletePayment } from '../hooks/useQueries';
import type { SerializablePayment } from '../lib/bigIntUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentIndex: number;
  payment: SerializablePayment;
  houseId: string;
}

export default function DeletePaymentDialog({
  open,
  onOpenChange,
  paymentIndex,
  payment,
  houseId,
}: DeletePaymentDialogProps) {
  const deletePayment = useDeletePayment();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp / 1000000);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handleDelete = () => {
    deletePayment.mutate(
      { paymentIndex, houseId },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Payment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this payment? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 p-4 rounded-lg border bg-muted/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-semibold">{formatDate(payment.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method:</span>
              <span className="font-semibold">{payment.paymentMethod}</span>
            </div>
            {payment.note && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Note:</span>
                <p className="mt-1">{payment.note}</p>
              </div>
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePayment.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deletePayment.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletePayment.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
