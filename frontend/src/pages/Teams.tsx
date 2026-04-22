import { useEffect, useState } from "react";
import { Ban, CheckCircle2, Download, Link as LinkIcon, Send, ShieldAlert, Star, Trash2, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useParams } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearInvitationLinks,
  createTeamApplication,
  disqualifyTeamMember,
  exportTeamsFile,
  fetchTeams,
  updateTeamStatus,
} from "../store/teams";
import type { DynamicFieldValue, ExportFormat, FormField, TeamStatus } from "../domain/types";
import { InputTextField } from "../ui/InputTextField";
import {
  buildInvitationLinkViews,
  changeMemberKind,
  createEmptyExistingMember,
  createEmptyNewMember,
  normalizeCaptain,
  toTeamApplicationRequest,
  validateTeamApplicationForm,
  type InvitationLinkView,
  type TeamApplicationFormValues,
  type TeamMemberFormValues,
} from "../domain/teamForms";
import { fetchFormFields, fetchHackathon } from "../store/hackathons";
import { explainHackathonManagementAccess } from "../domain/access";
import {
  formatTeamDate,
  getTeamCaptain,
  normalizeModerationReason,
  teamMemberStatusLabels,
  teamStatusLabels,
  teamStatusOptions,
  type TeamStatusFilter,
} from "../domain/teamModeration";
import { emptyFieldValue, prepareTeamFieldValues, validateRequiredTeamFields } from "../domain/teamFieldValues";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Teams() {
  const { hackathonId } = useParams();
  const dispatch = useAppDispatch();
  const teams = useAppSelector((state) => state.teams.items);
  const hackathon = useAppSelector((state) => state.hackathons.current);
  const fields = useAppSelector((state) => state.hackathons.fields);
  const user = useAppSelector((state) => state.auth.user);
  const [form, setForm] = useState<TeamApplicationFormValues>({
    name: "",
    fields: {},
    members: [{ ...createEmptyExistingMember("captain"), captain: true }],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [inviteViews, setInviteViews] = useState<InvitationLinkView[]>([]);
  const [statusFilter, setStatusFilter] = useState<TeamStatusFilter>("all");
  const [moderationReasons, setModerationReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!hackathonId) return;
    void dispatch(fetchTeams({
      hackathonId,
      status: statusFilter === "all" ? undefined : statusFilter,
    }));
  }, [dispatch, hackathonId, statusFilter]);

  useEffect(() => {
    if (!hackathonId) return;
    void dispatch(fetchHackathon(hackathonId));
    void dispatch(fetchFormFields({ hackathonId, scope: "team" }));
  }, [dispatch, hackathonId]);

  const minTeamSize = hackathon?.minTeamSize ?? 1;
  const maxTeamSize = hackathon?.maxTeamSize ?? 5;
  const managementAccess = explainHackathonManagementAccess(user, hackathon);
  const visibleTeamFields = fields.filter((field) => field.visible);

  const updateMember = (id: string, patch: Partial<TeamMemberFormValues>) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((member) => member.id === id ? { ...member, ...patch } : member),
    }));
  };

  const updateMemberKind = (id: string, kind: TeamMemberFormValues["kind"]) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((member) => member.id === id ? changeMemberKind(member, kind) : member),
    }));
  };

  const addMember = (kind: TeamMemberFormValues["kind"]) => {
    const id = crypto.randomUUID();
    setForm((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        kind === "existing_user" ? createEmptyExistingMember(id) : createEmptyNewMember(id),
      ],
    }));
  };

  const removeMember = (id: string) => {
    setForm((prev) => {
      const members = prev.members.filter((member) => member.id !== id);
      if (!members.some((member) => member.captain) && members[0]) {
        members[0] = { ...members[0], captain: true };
      }
      return { ...prev, members };
    });
  };

  const setCaptain = (id: string) => {
    setForm((prev) => ({
      ...prev,
      members: normalizeCaptain(prev.members, id),
    }));
  };

  const updateTeamField = (key: string, value: DynamicFieldValue) => {
    setForm((prev) => ({
      ...prev,
      fields: { ...prev.fields, [key]: value },
    }));
  };

  const renderTeamField = (field: FormField) => {
    const value = form.fields[field.key] ?? emptyFieldValue(field);
    const label = `${field.label}${field.required ? " *" : ""}`;

    if (field.type === "select" || field.type === "radio") {
      return (
        <div key={field.id}>
          <label className="mb-1.5 block text-sm font-semibold">{label}</label>
          <Select
            value={typeof value === "string" ? value : ""}
            onValueChange={(nextValue) => updateTeamField(field.key, nextValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите значение" />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label key={field.id} className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateTeamField(field.key, event.target.checked)}
          />
          {label}
        </label>
      );
    }

    return (
      <InputTextField
        key={field.id}
        label={label}
        value={typeof value === "string" ? value : ""}
        type={field.type === "email" || field.type === "url" ? field.type : "text"}
        multiline={field.type === "textarea"}
        minRows={field.type === "textarea" ? 3 : undefined}
        onChange={(event) => updateTeamField(field.key, event.target.value)}
      />
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hackathonId) return;

    const validation = validateTeamApplicationForm(form, minTeamSize, maxTeamSize);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    const preparedFields = prepareTeamFieldValues(visibleTeamFields, form.fields);
    const fieldErrors = validateRequiredTeamFields(visibleTeamFields, preparedFields);
    if (fieldErrors.length > 0) {
      setErrors(fieldErrors);
      return;
    }

    dispatch(clearInvitationLinks());
    setInviteViews([]);
    const response = await dispatch(createTeamApplication({
      hackathonId,
      application: toTeamApplicationRequest(form, preparedFields),
    })).unwrap();

    if (response) {
      setErrors([]);
      setInviteViews(buildInvitationLinkViews(response));
      setForm({
        name: "",
        fields: {},
        members: [{ ...createEmptyExistingMember("captain"), captain: true }],
      });
    }
  };

  const updateModerationReason = (teamId: string, value: string) => {
    setModerationReasons((prev) => ({ ...prev, [teamId]: value }));
  };

  const handleTeamStatus = async (teamId: string, status: TeamStatus) => {
    if (!hackathonId) return;
    await dispatch(updateTeamStatus({
      hackathonId,
      teamId,
      status,
      reason: normalizeModerationReason(moderationReasons[teamId] ?? ""),
    }));
  };

  const handleDisqualifyMember = async (teamId: string, memberId: string) => {
    if (!hackathonId) return;
    await dispatch(disqualifyTeamMember({ hackathonId, teamId, memberId }));
  };

  const handleExport = async (format: ExportFormat) => {
    if (!hackathonId) return;
    const blob = await dispatch(exportTeamsFile({ hackathonId, format })).unwrap();
    if (!blob) return;
    downloadBlob(blob, `teams.${format}`);
  };

  return (
    <GridBackGroundLayout className="py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-3xl font-bold tracking-normal md:text-4xl">Команды</h1>
            <p className="mt-2 text-muted-foreground">Заявки, составы и модерация участников хакатона</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Подать заявку</CardTitle>
                <CardDescription>Размер команды: {minTeamSize}-{maxTeamSize}</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={form.members.length >= maxTeamSize}
                  onClick={() => addMember("existing_user")}
                >
                  <LinkIcon className="h-4 w-4" />
                  Добавить по логину
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={form.members.length >= maxTeamSize}
                  onClick={() => addMember("new_user")}
                >
                  <UserPlus className="h-4 w-4" />
                  Добавить нового
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>{errors.join(". ")}</AlertDescription>
                </Alert>
              )}

              <InputTextField
                label="Название команды"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />

              {visibleTeamFields.length > 0 && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <h3 className="font-bold">Поля команды</h3>
                  {visibleTeamFields.map(renderTeamField)}
                </div>
              )}

              <div className="space-y-4">
                {form.members.map((member, index) => (
                  <div key={member.id} className="rounded-lg border bg-background/70 p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-bold">Участник {index + 1}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={member.captain ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCaptain(member.id)}
                        >
                          <Star className="h-4 w-4" />
                          Капитан
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={form.members.length <= 1}
                          onClick={() => removeMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">Тип участника</label>
                        <Select
                          value={member.kind}
                          onValueChange={(value) => updateMemberKind(member.id, value as TeamMemberFormValues["kind"])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="existing_user">Существующий пользователь</SelectItem>
                            <SelectItem value="new_user">Новый участник</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {member.kind === "existing_user" ? (
                        <InputTextField
                          label="Логин пользователя"
                          value={member.login}
                          onChange={(event) => updateMember(member.id, { login: event.target.value })}
                        />
                      ) : (
                        <>
                          <InputTextField
                            label="ФИО"
                            value={member.fullName}
                            onChange={(event) => updateMember(member.id, { fullName: event.target.value })}
                          />
                          <InputTextField
                            label="Почта"
                            type="email"
                            value={member.email}
                            onChange={(event) => updateMember(member.id, { email: event.target.value })}
                          />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <InputTextField
                              label="Учебное заведение"
                              value={member.education}
                              onChange={(event) => updateMember(member.id, { education: event.target.value })}
                            />
                            <InputTextField
                              label="Курс"
                              value={member.course}
                              onChange={(event) => updateMember(member.id, { course: event.target.value })}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button type="submit">
                <Send className="h-4 w-4" />
                Подать заявку
              </Button>
            </form>
          </CardContent>
        </Card>

        {inviteViews.length > 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Ссылки приглашений</AlertTitle>
            <AlertDescription className="space-y-2">
              {inviteViews.map((link) => (
                <div key={link.memberId}>
                  <div className="font-semibold">{link.label}</div>
                  <div className="break-all text-muted-foreground">{link.url}</div>
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Таблица заявок</CardTitle>
                <CardDescription>Статусы команд, составы, капитаны и модерация участников</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!managementAccess.allowed || teams.length === 0}
                  onClick={() => void handleExport("csv")}
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!managementAccess.allowed || teams.length === 0}
                  onClick={() => void handleExport("xlsx")}
                >
                  <Download className="h-4 w-4" />
                  XLSX
                </Button>
                <div className="min-w-56">
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TeamStatusFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{managementAccess.reason}</AlertDescription>
            </Alert>

            <div className="overflow-x-auto rounded-lg border bg-background/70">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead className="bg-muted/70 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Команда</th>
                    <th className="px-4 py-3 font-semibold">Статус</th>
                    <th className="px-4 py-3 font-semibold">Капитан</th>
                    <th className="px-4 py-3 font-semibold">Состав</th>
                    <th className="px-4 py-3 font-semibold">Подача</th>
                    <th className="px-4 py-3 font-semibold">Причина</th>
                    <th className="px-4 py-3 text-right font-semibold">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const captain = getTeamCaptain(team);
                    const reason = moderationReasons[team.id] ?? team.moderationReason ?? "";
                    return (
                      <tr key={team.id} className="border-t align-top">
                        <td className="px-4 py-4">
                          <div className="font-bold">{team.name}</div>
                          <div className="text-muted-foreground">{team.members.length} участн.</div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={team.status === "admitted" ? "secondary" : "default"}>
                            {teamStatusLabels[team.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          {captain ? (
                            <div>
                              <div>{captain.fullName}</div>
                              {captain.login && <div className="text-muted-foreground">@{captain.login}</div>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Не выбран</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {team.members.map((member) => (
                              <span
                                key={member.id}
                                className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-semibold"
                              >
                                {member.fullName}{member.captain ? " · капитан" : ""} · {teamMemberStatusLabels[member.status]}
                                {managementAccess.allowed && member.status !== "disqualified" && (
                                  <button
                                    type="button"
                                    className="text-destructive"
                                    title="Дисквалифицировать"
                                    onClick={() => void handleDisqualifyMember(team.id, member.id)}
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatTeamDate(team.submittedAt)}</td>
                        <td className="min-w-56 px-4 py-4">
                          <InputTextField
                            label="Причина"
                            value={reason}
                            disabled={!managementAccess.allowed}
                            onChange={(event) => updateModerationReason(team.id, event.target.value)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!managementAccess.allowed || team.status === "admitted"}
                              onClick={() => void handleTeamStatus(team.id, "admitted")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Допустить
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!managementAccess.allowed || team.status === "rejected"}
                              onClick={() => void handleTeamStatus(team.id, "rejected")}
                            >
                              <ShieldAlert className="h-4 w-4" />
                              Отклонить
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!managementAccess.allowed || team.status === "disqualified"}
                              onClick={() => void handleTeamStatus(team.id, "disqualified")}
                            >
                              <Ban className="h-4 w-4" />
                              Дискв.
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </GridBackGroundLayout>
  );
}
