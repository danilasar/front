import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createOrganizer, fetchOrganizers } from "../store/admin";
import { InputTextField } from "../ui/InputTextField";
import {
  toOrganizerRequest,
  validateOrganizerForm,
  type OrganizerFormValues,
} from "../domain/adminForms";

const initialOrganizerForm: OrganizerFormValues = {
  fullName: "",
  email: "",
  password: "password",
  phone: "",
};


export default function NewOrganizer() {
  const dispatch = useAppDispatch();
  const organizers = useAppSelector((state) => state.admin.organizers);
  const [organizerForm, setOrganizerForm] = useState(initialOrganizerForm);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    void dispatch(fetchOrganizers());
  }, [dispatch]);

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

  return (
    <GridBackGroundLayout className="py-14">
      <div className="w-full max-w-5xl space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <CardTitle className="text-3xl mb-2">Администрирование</CardTitle>
                <CardDescription>Управление организаторами</CardDescription>
              </div>
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>{errors.join(". ")}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Новый организатор</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrganizer} className="space-y-4">
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
                <Button type="submit" className="w-full">Создать организатора</Button>
              </form>
            </CardContent>
          </Card>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Организаторы</h3>
            {organizers.map((organizer) => (
              <Card key={organizer.id}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold">{organizer.fullName}</h4>
                  <p className="text-sm text-muted-foreground">{organizer.email}</p>
                  <p className="text-sm">Роль: {organizer.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </GridBackGroundLayout>
  );
}
