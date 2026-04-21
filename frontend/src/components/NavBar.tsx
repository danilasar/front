import { alpha, AppBar, Toolbar, Button, Box, useTheme, IconButton, Tooltip, SvgIcon } from "@mui/material";
import { Link } from "react-router-dom";
import { navRouters } from "../routes";
import { useContext } from "react";
import { ColorModeContext } from "../themeModeContext";
import LightModeIcon from "@mui/icons-material/LightMode"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import { useAppSelector } from "../store/hooks";
import Icon from "../assets/icon.svg?react";

export default function NavBar() {
  const { toggleTheme } = useContext(ColorModeContext);
  const { isAuth, user } = useAppSelector((state) => state.auth);

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const visibleRoutes = navRouters.filter((route) => {
    if (route.isPrivate && !isAuth) return false;
    if (route.roles && (!user || !route.roles.includes(user.role))) return false;
    return route.inNav !== false;
  });

  return (
    <Box
      sx={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        top: { xs: 10, sm: 18 },
        zIndex: 1000,
        width: "min(1120px, calc(100vw - 24px))",
      }}
    >
      <AppBar
        position="static"
        sx={{
          borderRadius: "8px",
          background: theme.palette.mode === "dark"
            ? alpha("#0A3554", 0.72)
            : alpha("#FFFFFF", 0.58),
          border: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.22 : 0.74)}`,
          boxShadow: `0 18px 48px ${alpha("#087FB2", theme.palette.mode === "dark" ? 0.28 : 0.18)}, inset 0 1px 0 ${alpha("#FFFFFF", 0.78)}`,
          backdropFilter: "blur(18px) saturate(160%)",
          px: 0.75,
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: 58, px: { xs: 1, sm: 2 }, overflowX: "auto" }}>
          <SvgIcon component={Icon} inheritViewBox sx={{ width: 34, height: 34, flexShrink: 0, color: theme.palette.secondary.main }} />
          {visibleRoutes.map((route) => (
            <Button
              key={route.path}
              component={Link}
              to={route.path}
              sx={{
                color: theme.palette.text.primary,
                background: "transparent",
                whiteSpace: "nowrap",
                "&:hover": {
                  background: alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.12 : 0.48),
                },
              }}
            >
              {route.label}
            </Button>
          ))}
          {!isAuth && (
            <Button component={Link} to="/login" sx={{ color: theme.palette.text.primary }}>
              Войти
            </Button>
          )}
          <Tooltip title={isDark ? "Светлая тема" : "Темная тема"}>
            <IconButton onClick={toggleTheme}>
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
