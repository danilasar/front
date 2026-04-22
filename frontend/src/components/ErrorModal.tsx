import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearError } from "../store/settings";

export const ErrorModal = () => {
  const dispatch = useAppDispatch();

  const { error, isErrorModalOpen } = useAppSelector(
    (state) => state.settings
  );

  const handleClose = () => {
    dispatch(clearError());
  };

  return (
    <Dialog open={isErrorModalOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-500">Ошибка</DialogTitle>
        </DialogHeader>
        <div className="text-red-500 py-4">
          {error}
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
