import { useEffect } from "react";
import { Alert, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchFormFields, fetchHackathon } from "../store/hackathons";
import { explainHackathonManagementAccess } from "../domain/access";

export default function HackathonDetails() {
  const { hackathonId } = useParams();
  const dispatch = useAppDispatch();
  const hackathon = useAppSelector((state) => state.hackathons.current);
  const fields = useAppSelector((state) => state.hackathons.fields);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!hackathonId) return;
    void dispatch(fetchHackathon(hackathonId));
    void dispatch(fetchFormFields({ hackathonId, scope: "registration" }));
  }, [dispatch, hackathonId]);

  const access = explainHackathonManagementAccess(user, hackathon);

  return (
    <GridBackGroundLayout sx={{ py: 14 }}>
      <Stack spacing={3} sx={{ width: "min(900px, 100%)", px: 2 }}>
        {hackathon && (
          <>
            <Card>
              <CardContent>
            <Stack spacing={1}>
              <Chip label={hackathon.status} color={hackathon.status === "active" ? "secondary" : "default"} />
              <Typography variant="h3">{hackathon.title}</Typography>
              <Typography color="text.secondary">{hackathon.description}</Typography>
            </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Параметры регистрации</Typography>
                <Typography>Размер команды: {hackathon.minTeamSize}-{hackathon.maxTeamSize}</Typography>
                <Typography>Полей формы: {fields.length}</Typography>
              </CardContent>
            </Card>

            <Alert severity={access.allowed ? "success" : "info"}>{access.reason}</Alert>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button component={Link} to={`/hackathons/${hackathon.id}/teams`} variant="contained">
                Команды
              </Button>
              <Button component={Link} to="/hackathons" variant="outlined">
                Назад к списку
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </GridBackGroundLayout>
  );
}
