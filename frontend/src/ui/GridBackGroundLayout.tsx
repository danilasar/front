import { alpha } from "@mui/material";
import { CenterFullScreenLayout, type CenterFullScreenLaoutProps } from "./CenterFullScreenLayout";

export const GridBackGroundLayout = ({ children, sx, ...props }: CenterFullScreenLaoutProps) => {
  return (
    <CenterFullScreenLayout sx={[(theme) => {
      const gridColor = alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.2 : 0.24);
      const shine = theme.palette.mode === "dark"
        ? alpha("#7BE3FF", 0.12)
        : alpha("#FFFFFF", 0.62);
      const water = theme.palette.mode === "dark"
        ? alpha("#0D5C87", 0.45)
        : alpha("#6EE7F9", 0.34);
      return {
        isolation: "isolate",
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.default,
        backgroundImage: `
            linear-gradient(180deg, ${shine} 0%, transparent 34%),
            radial-gradient(120% 70% at 50% -10%, ${alpha("#FFFFFF", theme.palette.mode === "dark" ? 0.14 : 0.9)} 0%, transparent 52%),
            linear-gradient(135deg, ${alpha("#87E8FF", theme.palette.mode === "dark" ? 0.18 : 0.46)} 0%, transparent 38%, ${water} 100%),
            linear-gradient(${gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
          `,
        backgroundSize: "auto, auto, auto, 40px 40px, 40px 40px",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: -1,
          backgroundImage: `
            linear-gradient(115deg, transparent 0%, ${alpha("#FFFFFF", theme.palette.mode === "dark" ? 0.08 : 0.42)} 48%, transparent 58%),
            linear-gradient(180deg, transparent 0%, ${alpha("#41D6FF", theme.palette.mode === "dark" ? 0.08 : 0.2)} 100%)
          `,
          transform: "skewY(-4deg) translateY(-12%)",
        },
      };
    },
    ...(Array.isArray(sx) ? sx : [sx])
    ]} {...props}>
      {children}
    </CenterFullScreenLayout>
  )
}
