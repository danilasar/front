import { Button, Chip, Stack, SvgIcon, Typography, useTheme } from "@mui/material";
import Icon from "../assets/icon.svg?react"
import { Link } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchActiveHackathon } from "../store/hackathons";

export default function Home() {
  const dispatch = useAppDispatch();
  const active = useAppSelector((state) => state.hackathons.active);
  const theme = useTheme();

  useEffect(() => {
    void dispatch(fetchActiveHackathon());
  }, [dispatch]);

  return (
    <GridBackGroundLayout sx={{ minWidth: '100vw', textAlign: "center" }}>
        <SvgIcon component={Icon} inheritViewBox
          sx={{
            width: 100,
            height: 100,
            fontSize: 'inherit',
            flexShrink: 0,
            color: "#FFFFFF"
          }} />
        <Typography variant="h2" sx={{ padding: 2 }}>
          Менеджер хакатонов
        </Typography>
        <Typography variant="h5" sx={{ padding: 2, maxWidth: 860 }}>
          Управляйте мероприятиями, регистрацией, командами и экспортом данных из одного интерфейса.
        </Typography>
        {active && (
          <Stack alignItems="center" spacing={1} sx={{ my: 3 }}>
            <Chip label="Активный хакатон" color="secondary" />
            <Typography variant="h4">{active.title}</Typography>
            <Typography color="text.secondary">{active.description}</Typography>
          </Stack>
        )}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button component={Link} to="/hackathons" variant="contained" sx={{
            borderRadius: "8px",
            px: 2.5,
            boxShadow: 3,
            color: theme.palette.text.primary,
            background: theme.palette.primary.main
          }}>
            Смотреть хакатоны
          </Button>
          <Button component={Link} to="/profile" variant="outlined">
            Личный кабинет
          </Button>
        </Stack>
      </GridBackGroundLayout>
  );
}
