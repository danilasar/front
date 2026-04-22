import { useEffect, useMemo, useState } from "react";
import { Archive, Zap, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { assignOrganizer, fetchOrganizers } from "../store/admin";
import { activateHackathon, createHackathon, fetchHackathons } from "../store/hackathons";
import { InputTextField } from "../ui/InputTextField";
import {
  toHackathonRequest,
  validateHackathonForm,
  type HackathonFormValues,
} from "../domain/adminForms";
import {
  filterHackathons,
  formatHackathonPeriod,
  hackathonStatusLabels,
  hackathonStatusOptions,
  type HackathonStatusFilter,
} from "../domain/hackathonManagement";

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

const NO_ORGANIZER_VALUE = "__no_organizer__";

export default function NewHackathon() {
  const dispatch = useAppDispatch();
  const organizers = useAppSelector((state) => state.admin.organizers);
  const hackathons = useAppSelector((state) => state.hackathons.items);
  const [hackathonForm, setHackathonForm] = useState(initialHackathonForm);
  const [assignment, setAssignment] = useState({ hackathonId: "", organizerId: "" });
  const [hackathonStatusFilter, setHackathonStatusFilter] = useState<HackathonStatusFilter>("all");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    void dispatch(fetchOrganizers());
    void dispatch(fetchHackathons());
  }, [dispatch]);

  const organizerOptions = useMemo(
    () => organizers.map((organizer) => ({ id: organizer.id, label: `${organizer.fullName} · ${organizer.email}` })),
    [organizers],
  );

  const filteredHackathons = useMemo(
    () => filterHackathons(hackathons, hackathonStatusFilter),
    [hackathons, hackathonStatusFilter],
  );

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

  const handleActivateHackathon = async (hackathonId: string) => {
    const activated = await dispatch(activateHackathon(hackathonId)).unwrap();
    if (activated) {
      await dispatch(fetchHackathons());
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
                <CardDescription>Управление хакатонами</CardDescription>
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
              <CardTitle>Новый хакатон</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateHackathon} className="space-y-4">
                <InputTextField
                  label="Название"
                  value={hackathonForm.title}
                  onChange={(event) => setHackathonForm((prev) => ({ ...prev, title: event.target.value }))}
                />
                <InputTextField
                  label="Описание"
                  value={hackathonForm.description}
                  onChange={(event) => setHackathonForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Введите описание..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <InputTextField
                    label="Начало"
                    type="date"
                    value={hackathonForm.startsAt}
                    onChange={(event) => setHackathonForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                  />
                  <InputTextField
                    label="Окончание"
                    type="date"
                    value={hackathonForm.endsAt}
                    onChange={(event) => setHackathonForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
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
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Организатор</label>
                  <Select
                    value={hackathonForm.organizerId || NO_ORGANIZER_VALUE}
                    onValueChange={(value) => setHackathonForm((prev) => ({
                      ...prev,
                      organizerId: value === NO_ORGANIZER_VALUE ? "" : value,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите организатора" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ORGANIZER_VALUE}>Назначить позже</SelectItem>
                      {organizerOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Создать хакатон</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Назначение организатора</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssignOrganizer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Хакатон</label>
                  <Select value={assignment.hackathonId} onValueChange={(value) => setAssignment((prev) => ({ ...prev, hackathonId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите хакатон" />
                    </SelectTrigger>
                    <SelectContent>
                      {hackathons.map((hackathon) => (
                        <SelectItem key={hackathon.id} value={hackathon.id}>{hackathon.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Организатор</label>
                  <Select value={assignment.organizerId} onValueChange={(value) => setAssignment((prev) => ({ ...prev, organizerId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите организатора" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizerOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">Назначить</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold">Хакатоны</h3>
                <p className="text-sm text-muted-foreground">Список, архив и активное событие</p>
              </div>
              <div className="w-full sm:w-48">
                <label className="text-sm font-medium text-foreground mb-1 block">Статус</label>
                <Select value={hackathonStatusFilter} onValueChange={(value) => setHackathonStatusFilter(value as HackathonStatusFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hackathonStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filteredHackathons.map((hackathon) => (
              <Card key={hackathon.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <h4 className="font-semibold">{hackathon.title}</h4>
                    <Badge variant={hackathon.status === "active" ? "secondary" : "default"} className="flex gap-1">
                      {hackathon.status === "archived" && <Archive className="w-3 h-3" />}
                      {hackathonStatusLabels[hackathon.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatHackathonPeriod(hackathon)}</p>
                  <p className="text-sm">Организаторов назначено: {hackathon.organizerIds.length}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={hackathon.status === "active"}
                    onClick={() => {
                      void handleActivateHackathon(hackathon.id);
                    }}
                    className="w-full gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Сделать активным
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </GridBackGroundLayout>
  );
}
