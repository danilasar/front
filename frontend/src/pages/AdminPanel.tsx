import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { assignOrganizer, createOrganizer, fetchOrganizers } from "../store/admin";
import { createHackathon, fetchHackathons } from "../store/hackathons";
import { InputTextField } from "../ui/InputTextField";
import {
  toHackathonRequest,
  toOrganizerRequest,
  validateHackathonForm,
  validateOrganizerForm,
  type HackathonFormValues,
  type OrganizerFormValues,
} from "../domain/adminForms";

const initialOrganizerForm: OrganizerFormValues = {
  fullName: "",
  email: "",
  password: "password",
  phone: "",
};

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const initialHackathonForm: HackathonFormValues = {
  title: "",
  description: "",
  startsAt: today,
  endsAt: tomorrow,
  minTeamSize: 1,
  maxTeamSize: 5,
  organizerId: "",
};

export default function AdminPanel() {
  const dispatch = useAppDispatch();
  const organizers = useAppSelector((state) => state.admin.organizers);
  const hackathons = useAppSelector((state) => state.hackathons.items);
  const [organizerForm, setOrganizerForm] = useState(initialOrganizerForm);
  const [hackathonForm, setHackathonForm] = useState(initialHackathonForm);
  const [assignment, setAssignment] = useState({ hackathonId: "", organizerId: "" });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    void dispatch(fetchOrganizers());
    void dispatch(fetchHackathons());
  }, [dispatch]);

  const organizerOptions = useMemo(
    () => organizers.map((organizer) => ({ id: organizer.id, label: `${organizer.fullName} · ${organizer.email}` })),
    [organizers],
  );

  const handleCreateOrganizer = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateOrganizerForm(organizerForm);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const created = await dispatch(createOrganizer(toOrganizerRequest(organizerForm))).unwrap();
    if (created) {
      setOrganizerForm(initialOrganizerForm);
      setErrors([]);
    }
  };

  const handleCreateHackathon = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateHackathonForm(hackathonForm);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const created = await dispatch(createHackathon(toHackathonRequest(hackathonForm))).unwrap();
    if (created && hackathonForm.organizerId) {
      await dispatch(assignOrganizer({ hackathonId: created.id, organizerId: hackathonForm.organizerId }));
    }
    if (created) {
      await dispatch(fetchHackathons());
      setHackathonForm(initialHackathonForm);
      setErrors([]);
    }
  };

  const handleAssignOrganizer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignment.hackathonId || !assignment.organizerId) {
      setErrors(["Выберите хакатон и организатора"]);
      return;
    }

    await dispatch(assignOrganizer(assignment));
    await dispatch(fetchHackathons());
    setAssignment({ hackathonId: "", organizerId: "" });
    setErrors([]);
  };

  return (
    <GridBackGroundLayout sx={{ py: 14 }}>
      <Stack spacing={3} sx={{ width: "min(900px, 100%)", px: 2 }}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">Администрирование</Typography>
              <Typography color="text.secondary">Глобальные сущности: хакатоны, организаторы и назначения</Typography>
              {errors.length > 0 && (
                <Alert severity="error">
                  {errors.join(". ")}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3}>
          <Card>
            <CardContent>
              <Stack component="form" spacing={2} onSubmit={handleCreateOrganizer}>
                <Typography variant="h5">Новый организатор</Typography>
                <InputTextField
                  label="ФИО"
                  value={organizerForm.fullName}
                  onChange={(event) => setOrganizerForm((prev) => ({ ...prev, fullName: event.target.value }))}
                />
                <InputTextField
                  label="Почта"
                  type="email"
                  value={organizerForm.email}
                  onChange={(event) => setOrganizerForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                <InputTextField
                  label="Пароль"
                  type="password"
                  value={organizerForm.password}
                  onChange={(event) => setOrganizerForm((prev) => ({ ...prev, password: event.target.value }))}
                />
                <InputTextField
                  label="Телефон"
                  value={organizerForm.phone}
                  onChange={(event) => setOrganizerForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
                <Button type="submit" variant="contained">Создать организатора</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack component="form" spacing={2} onSubmit={handleCreateHackathon}>
                <Typography variant="h5">Новый хакатон</Typography>
                <InputTextField
                  label="Название"
                  value={hackathonForm.title}
                  onChange={(event) => setHackathonForm((prev) => ({ ...prev, title: event.target.value }))}
                />
                <InputTextField
                  label="Описание"
                  value={hackathonForm.description}
                  onChange={(event) => setHackathonForm((prev) => ({ ...prev, description: event.target.value }))}
                  multiline
                  minRows={3}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <InputTextField
                    label="Начало"
                    type="date"
                    value={hackathonForm.startsAt}
                    onChange={(event) => setHackathonForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <InputTextField
                    label="Окончание"
                    type="date"
                    value={hackathonForm.endsAt}
                    onChange={(event) => setHackathonForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <InputTextField
                    label="Мин. участников"
                    type="number"
                    value={hackathonForm.minTeamSize}
                    onChange={(event) => setHackathonForm((prev) => ({ ...prev, minTeamSize: Number(event.target.value) }))}
                  />
                  <InputTextField
                    label="Макс. участников"
                    type="number"
                    value={hackathonForm.maxTeamSize}
                    onChange={(event) => setHackathonForm((prev) => ({ ...prev, maxTeamSize: Number(event.target.value) }))}
                  />
                </Stack>
                <FormControl fullWidth>
                  <InputLabel id="hackathon-organizer-label">Организатор</InputLabel>
                  <Select
                    labelId="hackathon-organizer-label"
                    label="Организатор"
                    value={hackathonForm.organizerId}
                    onChange={(event) => setHackathonForm((prev) => ({ ...prev, organizerId: event.target.value }))}
                  >
                    <MenuItem value="">Назначить позже</MenuItem>
                    {organizerOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained">Создать хакатон</Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardContent>
            <Stack component="form" spacing={2} onSubmit={handleAssignOrganizer}>
              <Typography variant="h5">Назначение организатора</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="assignment-hackathon-label">Хакатон</InputLabel>
                  <Select
                    labelId="assignment-hackathon-label"
                    label="Хакатон"
                    value={assignment.hackathonId}
                    onChange={(event) => setAssignment((prev) => ({ ...prev, hackathonId: event.target.value }))}
                  >
                    {hackathons.map((hackathon) => (
                      <MenuItem key={hackathon.id} value={hackathon.id}>{hackathon.title}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="assignment-organizer-label">Организатор</InputLabel>
                  <Select
                    labelId="assignment-organizer-label"
                    label="Организатор"
                    value={assignment.organizerId}
                    onChange={(event) => setAssignment((prev) => ({ ...prev, organizerId: event.target.value }))}
                  >
                    {organizerOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" sx={{ minWidth: 150 }}>Назначить</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3}>
          <Stack spacing={2}>
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

          <Stack spacing={2}>
            <Typography variant="h5">Хакатоны</Typography>
            {hackathons.map((hackathon) => (
              <Card key={hackathon.id}>
                <CardContent>
                  <Typography variant="h6">{hackathon.title}</Typography>
                  <Typography color="text.secondary">{hackathon.status}</Typography>
                  <Typography>Организаторов назначено: {hackathon.organizerIds.length}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      </Stack>
    </GridBackGroundLayout>
  );
}
