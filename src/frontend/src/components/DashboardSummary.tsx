import type { SerializableDashboardSummary } from '../lib/bigIntUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Home, DollarSign, TrendingUp, TrendingDown, Receipt, Percent } from 'lucide-react';

interface DashboardSummaryProps {
  summary: SerializableDashboardSummary | undefined;
}

export default function DashboardSummary({ summary }: DashboardSummaryProps) {
  if (!summary) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Houses',
      value: summary.totalHouses.toString(),
      icon: Home,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'Total Cost (with Interest)',
      value: formatCurrency(summary.totalCost),
      icon: DollarSign,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      title: 'Total Paid',
      value: formatCurrency(summary.totalPaid),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Remaining Balance',
      value: formatCurrency(summary.remainingBalance),
      icon: TrendingDown,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
    },
    {
      title: 'Total Interest',
      value: formatCurrency(summary.totalInterest),
      icon: Percent,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-950',
    },
    {
      title: 'Total Payments',
      value: summary.totalPayments.toString(),
      icon: Receipt,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Payment Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{summary.overallProgress.toFixed(2)}%</span>
            </div>
            <Progress value={summary.overallProgress} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(summary.remainingBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
