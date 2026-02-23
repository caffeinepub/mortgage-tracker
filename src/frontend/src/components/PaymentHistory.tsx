import { useState } from 'react';
import type { SerializablePayment } from '../lib/bigIntUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, FileText, DollarSign, Edit, Trash2, CreditCard } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import EditPaymentDialog from './EditPaymentDialog';
import DeletePaymentDialog from './DeletePaymentDialog';

interface PaymentHistoryProps {
  payments: SerializablePayment[];
  isLoading: boolean;
  houseName: string;
  houseId: string;
}

export default function PaymentHistory({ payments, isLoading, houseName, houseId }: PaymentHistoryProps) {
  const [editingPayment, setEditingPayment] = useState<{ payment: SerializablePayment; index: number } | null>(null);
  const [deletingPaymentIndex, setDeletingPaymentIndex] = useState<number | null>(null);

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History - {houseName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
            <p className="text-muted-foreground">
              Start tracking payments for {houseName} by adding your first payment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History - {houseName}</CardTitle>
            <Badge variant="secondary">{payments.length} payments</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(payment.amount)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(payment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>{payment.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPayment({ payment, index })}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPaymentIndex(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {payment.note && (
                    <div className="flex items-start gap-2 mt-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">{payment.note}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {editingPayment && (
        <EditPaymentDialog
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
          payment={editingPayment.payment}
          paymentIndex={editingPayment.index}
          houseId={houseId}
          houseName={houseName}
        />
      )}

      {deletingPaymentIndex !== null && (
        <DeletePaymentDialog
          open={deletingPaymentIndex !== null}
          onOpenChange={(open) => !open && setDeletingPaymentIndex(null)}
          paymentIndex={deletingPaymentIndex}
          payment={payments[deletingPaymentIndex]}
          houseId={houseId}
        />
      )}
    </>
  );
}
