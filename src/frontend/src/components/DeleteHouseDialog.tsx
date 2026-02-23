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
import { useDeleteHouse } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';

interface DeleteHouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  houseName: string;
  onDeleteSuccess?: () => void;
}

export default function DeleteHouseDialog({
  open,
  onOpenChange,
  houseId,
  houseName,
  onDeleteSuccess,
}: DeleteHouseDialogProps) {
  const deleteHouseMutation = useDeleteHouse();

  const handleDelete = async () => {
    try {
      await deleteHouseMutation.mutateAsync(houseId);
      onOpenChange(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error('Error deleting house:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete House</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <span className="font-semibold text-foreground">{houseName}</span>?
            </p>
            <p className="text-destructive font-medium">
              This action cannot be undone. This will permanently delete the house and all associated payment records.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteHouseMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteHouseMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteHouseMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete House'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
