import { useEffect, useState } from "react";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { invitationApi } from "../api/hackathonApi";
import {
  toInviteRegistrationInitialValues,
  toInviteRegistrationRequest,
  validateInviteRegistrationForm,
  type InviteRegistrationFormValues,
} from "../domain/inviteForms";
import type { Invitation } from "../domain/types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { completeInviteRegistration } from "../store/auth";
import { setError, startLoading, stopLoading } from "../store/settings";
import { InputTextField } from "../ui/InputTextField";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";

export default function Invite() {
  const { token } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuth = useAppSelector((state) => state.auth.isAuth);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [form, setForm] = useState<InviteRegistrationFormValues>(toInviteRegistrationInitialValues(null));
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        dispatch(startLoading());
        const response = await invitationApi.get(token);
        setInvitation(response);
        setForm(toInviteRegistrationInitialValues(response));
      } catch {
        dispatch(setError("Приглашение не найдено"));
      } finally {
        dispatch(stopLoading());
      }
    };
    void load();
  }, [dispatch, token]);

  const updateForm = (patch: Partial<InviteRegistrationFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const acceptExisting = async () => {
    if (!token) return;
    try {
      dispatch(startLoading());
      await invitationApi.acceptExisting(token);
      navigate("/profile");
    } catch {
      dispatch(setError("Не удалось принять приглашение"));
    } finally {
      dispatch(stopLoading());
    }
  };

  const completeRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const validation = validateInviteRegistrationForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const created = await dispatch(completeInviteRegistration({
      token,
      form: toInviteRegistrationRequest(form),
    })).unwrap();

    if (created) navigate("/profile");
  };

  return (
    <GridBackGroundLayout sx={{ py: 14 }}>
      <Stack spacing={3} sx={{ width: "min(900px, 100%)", px: 2 }}>
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Chip label={invitation?.status ?? "pending"} />
              <Typography variant="h3">Приглашение в команду</Typography>
              <Typography color="text.secondary">
                {invitation ? `${invitation.fullName} · действует до ${new Date(invitation.expiresAt).toLocaleDateString("ru-RU")}` : "Загрузка приглашения"}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {invitation && (
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h5">Уже есть аккаунт</Typography>
                  <Typography color="text.secondary">Войдите в аккаунт и привяжите его к месту в команде.</Typography>
                  {isAuth ? (
                    <Button variant="contained" startIcon={<LoginOutlinedIcon />} onClick={() => void acceptExisting()}>
                      Принять приглашение
                    </Button>
                  ) : (
                    <Button component={Link} to="/login" variant="outlined" startIcon={<LoginOutlinedIcon />}>
                      Войти
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack component="form" spacing={2} onSubmit={completeRegistration}>
                  <Typography variant="h5">Новый участник</Typography>
                  {errors.length > 0 && <Alert severity="error">{errors.join(". ")}</Alert>}
                  <InputTextField label="ФИО" value={form.fullName} onChange={(event) => updateForm({ fullName: event.target.value })} />
                  <InputTextField label="Почта" type="email" value={form.email} onChange={(event) => updateForm({ email: event.target.value })} />
                  <InputTextField label="Пароль" type="password" value={form.password} onChange={(event) => updateForm({ password: event.target.value })} />
                  <InputTextField label="Учебное заведение" value={form.education} onChange={(event) => updateForm({ education: event.target.value })} />
                  <InputTextField label="Курс" value={form.course} onChange={(event) => updateForm({ course: event.target.value })} />
                  <Button type="submit" variant="contained" startIcon={<PersonAddAltOutlinedIcon />}>
                    Завершить регистрацию
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}
      </Stack>
    </GridBackGroundLayout>
  );
}
