import type { ReactNode } from "react";
import { useAppSelector } from "../../store/hooks";
import { CircularProgress, Box } from "@mui/material";


export const CommonWrapper = ({ children }: { children: ReactNode }) => {
  const isLoading = useAppSelector((state) => state.settings.isLoading);

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          filter: isLoading ? "blur(4px)" : "none",
          pointerEvents: isLoading ? "none" : "auto",
          transition: "0.3s",
        }}
      >
        {children}
      </Box>

      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};
