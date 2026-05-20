import { useEffect, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
    <GridBackGroundLayout className="py-14">
      <div className="w-full max-w-4xl px-2 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Badge>{invitation?.status ?? "pending"}</Badge>
              <div>
                <CardTitle className="text-3xl mb-2">Приглашение в команду</CardTitle>
                <CardDescription>
                  {invitation ? `${invitation.fullName} · действует до ${new Date(invitation.expiresAt).toLocaleDateString("ru-RU")}` : "Загрузка приглашения"}
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        {invitation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Уже есть аккаунт</CardTitle>
                <CardDescription>Войдите в аккаунт и привяжите его к месте в команде.</CardDescription>
              </CardHeader>
              <CardContent>
                {isAuth ? (
                  <Button className="w-full gap-2" onClick={() => void acceptExisting()}>
                    <LogIn className="w-4 h-4" />
                    Принять приглашение
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full gap-2">
                    <Link to="/login">
                      <LogIn className="w-4 h-4" />
                      Войти
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Новый участник</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={completeRegistration} className="space-y-4">
                  {errors.length > 0 && <Alert variant="destructive"><AlertDescription>{errors.join(". ")}</AlertDescription></Alert>}
                  <InputTextField label="ФИО" value={form.fullName} onChange={(event) => updateForm({ fullName: event.target.value })} />
                  <InputTextField label="Почта" type="email" value={form.email} onChange={(event) => updateForm({ email: event.target.value })} />
                  <InputTextField label="Пароль" type="password" value={form.password} onChange={(event) => updateForm({ password: event.target.value })} />
                  <InputTextField label="Учебное заведение" value={form.education} onChange={(event) => updateForm({ education: event.target.value })} />
                  <InputTextField label="Курс" value={form.course} onChange={(event) => updateForm({ course: event.target.value })} />
                  <Button type="submit" className="w-full gap-2">
                    <UserPlus className="w-4 h-4" />
                    Завершить регистрацию
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </GridBackGroundLayout>
  );
}
