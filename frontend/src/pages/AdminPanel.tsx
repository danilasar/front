import { useEffect } from "react";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createOrganizer, fetchOrganizers } from "../store/admin";
import { createHackathon } from "../store/hackathons";

export default function AdminPanel() {
  const dispatch = useAppDispatch();
  const organizers = useAppSelector((state) => state.admin.organizers);

  useEffect(() => {
    void dispatch(fetchOrganizers());
  }, [dispatch]);

  const handleCreateOrganizer = () => {
    void dispatch(createOrganizer({
      email: `organizer-${Date.now()}@example.test`,
      password: "password",
      fullName: "Новый Организатор",
    }));
  };

  const handleCreateHackathon = () => {
    const start = new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + 2);
    void dispatch(createHackathon({
      title: "Новый хакатон",
      description: "Черновик мероприятия",
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      minTeamSize: 1,
      maxTeamSize: 5,
      landing: {
        heroTitle: "Новый хакатон",
        heroSubtitle: "Описание будет добавлено организатором",
      },
    }));
  };

  return (
    <GridBackGroundLayout sx={{ py: 14 }}>
      <Stack spacing={3} sx={{ width: "min(900px, 100%)", px: 2 }}>
        <Typography variant="h3">Администрирование</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button variant="contained" onClick={handleCreateHackathon}>Создать хакатон</Button>
          <Button variant="outlined" onClick={handleCreateOrganizer}>Создать организатора</Button>
        </Stack>

        <Typography variant="h5">Организаторы</Typography>
        {organizers.map((organizer) => (
          <Card key={organizer.id}>
            <CardContent>
              <Typography variant="h6">{organizer.fullName}</Typography>
              <Typography color="text.secondary">{organizer.email}</Typography>
              <Typography>Роль: {organizer.role}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </GridBackGroundLayout>
  );
}
