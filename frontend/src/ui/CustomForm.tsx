import { Box, Button } from "@mui/material";

export const CustomForm: React.FC<{
  onSubmit: () => void;
  children: React.ReactNode;
  buttonText: string,
}> = ({ onSubmit, children, buttonText }) => {
  return (
    <Box component="form" onSubmit={onSubmit}
      sx={{
        display: 'flex',
        flexDirection: "column",
        alignItems: 'center',
      }}
    >
      {children}
      <Button
        type="submit"
        variant="contained"
        sx={{
          mt: 2,
        }}
      >
        {buttonText}
      </Button>
    </Box>
  );
}
