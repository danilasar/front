import { useEffect, useState } from "react";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import LinkIcon from "@mui/icons-material/Link";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import ReportGmailerrorredIcon from "@mui/icons-material/ReportGmailerrorred";
import SendIcon from "@mui/icons-material/Send";
import StarsIcon from "@mui/icons-material/Stars";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Checkbox,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
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
import type { ExportFormat, TeamStatus } from "../domain/types";
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
import { fetchHackathon } from "../store/hackathons";
import { fetchFormFields } from "../store/hackathons";
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
import type { DynamicFieldValue, FormField } from "../domain/types";

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
    members: [
      {
        ...createEmptyExistingMember("captain"),
        captain: true,
      },
    ],
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

  const visibleTeamFields = fields.filter((field) => field.visible);

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
        <FormControl key={field.id} fullWidth>
          <InputLabel id={`team-field-${field.id}`}>{label}</InputLabel>
          <Select
            labelId={`team-field-${field.id}`}
            label={label}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => updateTeamField(field.key, event.target.value)}
          >
            {field.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (field.type === "checkbox") {
      return (
        <FormControlLabel
          key={field.id}
          control={(
            <Checkbox
              checked={Boolean(value)}
              onChange={(event) => updateTeamField(field.key, event.target.checked)}
            />
          )}
          label={label}
        />
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
    <GridBackGroundLayout sx={{ py: 14 }}>
      <Stack spacing={3} sx={{ width: "min(1100px, 100%)", px: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h3">Команды</Typography>
            <Typography color="text.secondary">Заявки, составы и модерация участников хакатона</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
              <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
                <Box>
                  <Typography variant="h5">Подать заявку</Typography>
                  <Typography color="text.secondary">
                    Размер команды: {minTeamSize}-{maxTeamSize}
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    disabled={form.members.length >= maxTeamSize}
                    onClick={() => addMember("existing_user")}
                  >
                    Добавить по логину
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<PersonAddAltIcon />}
                    disabled={form.members.length >= maxTeamSize}
                    onClick={() => addMember("new_user")}
                  >
                    Добавить нового
                  </Button>
                </Stack>
              </Box>

              {errors.length > 0 && (
                <Alert severity="error">{errors.join(". ")}</Alert>
              )}

              <InputTextField
                label="Название команды"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />

              {visibleTeamFields.length > 0 && (
                <Stack spacing={2}>
                  <Typography variant="h6">Поля команды</Typography>
                  {visibleTeamFields.map(renderTeamField)}
                </Stack>
              )}

              <Stack spacing={2}>
                {form.members.map((member, index) => (
                  <Box
                    key={member.id}
                    sx={(theme) => ({
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      p: 2,
                      background: theme.palette.mode === "dark"
                        ? "rgba(7, 27, 45, 0.42)"
                        : "rgba(255, 255, 255, 0.42)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
                    })}
                  >
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
                        <Typography variant="h6">Участник {index + 1}</Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            type="button"
                            variant={member.captain ? "contained" : "outlined"}
                            startIcon={<StarsIcon />}
                            onClick={() => setCaptain(member.id)}
                          >
                            Капитан
                          </Button>
                          <Button
                            type="button"
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineIcon />}
                            disabled={form.members.length <= 1}
                            onClick={() => removeMember(member.id)}
                          >
                            Удалить
                          </Button>
                        </Stack>
                      </Box>

                      <FormControl fullWidth>
                        <InputLabel id={`member-kind-${member.id}`}>Тип участника</InputLabel>
                        <Select
                          labelId={`member-kind-${member.id}`}
                          label="Тип участника"
                          value={member.kind}
                          onChange={(event) => {
                            updateMemberKind(member.id, event.target.value as TeamMemberFormValues["kind"]);
                          }}
                        >
                          <MenuItem value="existing_user">Существующий пользователь</MenuItem>
                          <MenuItem value="new_user">Новый участник</MenuItem>
                        </Select>
                      </FormControl>

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
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
                          </Stack>
                        </>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>

              <Button type="submit" variant="contained" startIcon={<SendIcon />}>Подать заявку</Button>
            </Stack>
          </CardContent>
        </Card>

        {inviteViews.length > 0 && (
          <Alert severity="success">
            <Stack spacing={1}>
              <Typography fontWeight={700}>Ссылки приглашений</Typography>
              {inviteViews.map((link) => (
                <Box key={link.memberId}>
                  <Typography fontWeight={700}>{link.label}</Typography>
                  <Typography sx={{ wordBreak: "break-word" }}>{link.url}</Typography>
                </Box>
              ))}
            </Stack>
          </Alert>
        )}

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap" alignItems="center">
                <Box>
                  <Typography variant="h5">Таблица заявок</Typography>
                  <Typography color="text.secondary">
                    Статусы команд, составы, капитаны и модерация участников
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<FileDownloadOutlinedIcon />}
                    disabled={!managementAccess.allowed || teams.length === 0}
                    onClick={() => void handleExport("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<FileDownloadOutlinedIcon />}
                    disabled={!managementAccess.allowed || teams.length === 0}
                    onClick={() => void handleExport("xlsx")}
                  >
                    XLSX
                  </Button>
                  <FormControl sx={{ minWidth: 220 }}>
                    <InputLabel id="team-status-filter-label">Статус</InputLabel>
                    <Select
                      labelId="team-status-filter-label"
                      label="Статус"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as TeamStatusFilter)}
                    >
                      {teamStatusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              <Alert severity={managementAccess.allowed ? "success" : "info"}>
                {managementAccess.reason}
              </Alert>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Команда</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Капитан</TableCell>
                      <TableCell>Состав</TableCell>
                      <TableCell>Подача</TableCell>
                      <TableCell>Причина</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teams.map((team) => {
                      const captain = getTeamCaptain(team);
                      const reason = moderationReasons[team.id] ?? team.moderationReason ?? "";
                      return (
                        <TableRow key={team.id} hover>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography fontWeight={700}>{team.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {team.members.length} участн.
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip label={teamStatusLabels[team.status]} color={team.status === "admitted" ? "secondary" : "default"} />
                          </TableCell>
                          <TableCell>
                            {captain ? (
                              <Stack spacing={0.5}>
                                <Typography>{captain.fullName}</Typography>
                                {captain.login && (
                                  <Typography variant="body2" color="text.secondary">@{captain.login}</Typography>
                                )}
                              </Stack>
                            ) : (
                              <Typography color="text.secondary">Не выбран</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {team.members.map((member) => (
                                <Chip
                                  key={member.id}
                                  label={`${member.fullName}${member.captain ? " · капитан" : ""} · ${teamMemberStatusLabels[member.status]}`}
                                  color={member.status === "pending_invitation" ? "primary" : member.status === "disqualified" ? "error" : "default"}
                                  onDelete={managementAccess.allowed && member.status !== "disqualified"
                                    ? () => {
                                      void handleDisqualifyMember(team.id, member.id);
                                    }
                                    : undefined}
                                  deleteIcon={<BlockIcon />}
                                />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell>{formatTeamDate(team.submittedAt)}</TableCell>
                          <TableCell sx={{ minWidth: 220 }}>
                            <InputTextField
                              label="Reason"
                              value={reason}
                              size="small"
                              disabled={!managementAccess.allowed}
                              onChange={(event) => updateModerationReason(team.id, event.target.value)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CheckCircleOutlineIcon />}
                                disabled={!managementAccess.allowed || team.status === "admitted"}
                                onClick={() => {
                                  void handleTeamStatus(team.id, "admitted");
                                }}
                              >
                                Допустить
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                startIcon={<ReportGmailerrorredIcon />}
                                disabled={!managementAccess.allowed || team.status === "rejected"}
                                onClick={() => {
                                  void handleTeamStatus(team.id, "rejected");
                                }}
                              >
                                Отклонить
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<BlockIcon />}
                                disabled={!managementAccess.allowed || team.status === "disqualified"}
                                onClick={() => {
                                  void handleTeamStatus(team.id, "disqualified");
                                }}
                              >
                                Дискв.
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </GridBackGroundLayout>
  );
}
