import { Box, Container, type BoxProps } from "@mui/material";
import type React from "react";

export type CenterFullScreenLaoutProps = BoxProps & {
  children: React.ReactNode;
};

export const CenterFullScreenLayout = ({ children, sx, ...props }: CenterFullScreenLaoutProps) => {
  return (
    <Box sx={[{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    ...(Array.isArray(sx) ? sx : [sx])
    ]} {...props}>
      <Container maxWidth="xl"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
        {children}
      </Container>
    </Box>
  )

}
