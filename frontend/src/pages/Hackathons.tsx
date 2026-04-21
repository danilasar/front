import { useEffect } from "react";
import { Box, Button, Card, CardActions, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchHackathons } from "../store/hackathons";
import { canCreateHackathon } from "../domain/access";

export default function Hackathons() {
  const dispatch = useAppDispatch();
  const hackathons = useAppSelector((state) => state.hackathons.items);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    void dispatch(fetchHackathons());
  }, [dispatch]);

  return (
    <GridBackGroundLayout sx={{ alignItems: "stretch", py: 14 }}>
      <Stack spacing={3} sx={{ width: "min(1100px, 100%)", px: 2 }}>
        <Card>
          <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h3">Хакатоны</Typography>
              <Typography color="text.secondary">Активные события, архив и черновики мероприятий</Typography>
            </Box>
          {canCreateHackathon(user?.role) && (
            <Button component={Link} to="/admin" variant="contained">
              Создать
            </Button>
          )}
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {hackathons.map((hackathon) => (
            <Grid size={{ xs: 12, md: 6 }} key={hackathon.id}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Chip label={hackathon.status} color={hackathon.status === "active" ? "secondary" : "default"} />
                    <Typography variant="h5">{hackathon.title}</Typography>
                    <Typography color="text.secondary">{hackathon.description}</Typography>
                    <Typography variant="body2">
                      Команда: {hackathon.minTeamSize}-{hackathon.maxTeamSize} участников
                    </Typography>
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button component={Link} to={`/hackathons/${hackathon.id}`}>
                    Подробнее
                  </Button>
                  <Button component={Link} to={`/hackathons/${hackathon.id}/teams`}>
                    Команды
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </GridBackGroundLayout>
  );
}
