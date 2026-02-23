import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface UpdateNotificationProps {
  open: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

export default function UpdateNotification({ open, onRefresh, onDismiss }: UpdateNotificationProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Update Available</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            A new version of Mortgage Tracker is available. Refresh now to get the latest features and improvements. Your data and session will be preserved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onDismiss}>
            Later
          </Button>
          <Button onClick={onRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
