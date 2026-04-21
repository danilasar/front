import { alpha } from "@mui/material";
import { CenterFullScreenLayout, type CenterFullScreenLaoutProps } from "./CenterFullScreenLayout";

export const GridBackGroundLayout = ({ children, sx, ...props }: CenterFullScreenLaoutProps) => {
  return (
    <CenterFullScreenLayout sx={[(theme) => {
      const gridColor = alpha(theme.palette.divider, 0.19);
      return {
        backgroundImage: `
            linear-gradient(${gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
          `,
        backgroundSize: "40px 40px",
      };
    },
    ...(Array.isArray(sx) ? sx : [sx])
    ]} {...props}>
      {children}
    </CenterFullScreenLayout>
  )
}
