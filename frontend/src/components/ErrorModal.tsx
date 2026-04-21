import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
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
    <Dialog
      open={isErrorModalOpen}
      onClose={handleClose}
    >
      <DialogTitle
        sx={(theme) => {
          return {
            color: theme.palette.error.main
          }
        }}
      >Ошибка</DialogTitle>
      <DialogContent>
        <Typography
          sx={(theme) => {
            return {
              color: theme.palette.error.main
            }
          }}
        >
          {error}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
