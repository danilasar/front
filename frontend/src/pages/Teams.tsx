import { useEffect, useState } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SendIcon from "@mui/icons-material/Send";
import StarsIcon from "@mui/icons-material/Stars";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearInvitationLinks, createTeamApplication, fetchTeams, updateTeamStatus } from "../store/teams";
import type { TeamStatus } from "../domain/types";
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

const nextStatus: TeamStatus = "admitted";

export default function Teams() {
  const { hackathonId } = useParams();
  const dispatch = useAppDispatch();
  const teams = useAppSelector((state) => state.teams.items);
  const hackathon = useAppSelector((state) => state.hackathons.current);
  const [form, setForm] = useState<TeamApplicationFormValues>({
    name: "",
    members: [
      {
        ...createEmptyExistingMember("captain"),
        captain: true,
      },
    ],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [inviteViews, setInviteViews] = useState<InvitationLinkView[]>([]);

  useEffect(() => {
    if (!hackathonId) return;
    void dispatch(fetchTeams({ hackathonId }));
    void dispatch(fetchHackathon(hackathonId));
  }, [dispatch, hackathonId]);

  const minTeamSize = hackathon?.minTeamSize ?? 1;
  const maxTeamSize = hackathon?.maxTeamSize ?? 5;

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hackathonId) return;

    const validation = validateTeamApplicationForm(form, minTeamSize, maxTeamSize);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    dispatch(clearInvitationLinks());
    setInviteViews([]);
    const response = await dispatch(createTeamApplication({
      hackathonId,
      application: toTeamApplicationRequest(form),
    })).unwrap();

    if (response) {
      setErrors([]);
      setInviteViews(buildInvitationLinkViews(response));
      setForm({
        name: "",
        members: [{ ...createEmptyExistingMember("captain"), captain: true }],
      });
    }
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

        {teams.map((team) => (
          <Card key={team.id}>
            <CardContent>
              <Stack spacing={1}>
                <Chip label={team.status} />
                <Typography variant="h5">{team.name}</Typography>
                <Typography color="text.secondary">Участников: {team.members.length}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {team.members.map((member) => (
                    <Chip
                      key={member.id}
                      label={`${member.fullName}${member.captain ? " · капитан" : ""}`}
                      color={member.status === "pending_invitation" ? "primary" : "default"}
                    />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
            <CardActions>
              <Button
                disabled={!hackathonId || team.status === nextStatus}
                onClick={() => {
                  if (hackathonId) {
                    void dispatch(updateTeamStatus({ hackathonId, teamId: team.id, status: nextStatus }));
                  }
                }}
              >
                Допустить
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </GridBackGroundLayout>
  );
}
