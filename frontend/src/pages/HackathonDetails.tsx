import { useEffect, useState } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createFormField,
  deleteFormField,
  fetchFormFields,
  fetchHackathon,
  updateFormField,
  uploadHackathonRules,
} from "../store/hackathons";
import { explainHackathonManagementAccess } from "../domain/access";
import { validateRulesPdf } from "../domain/rulesUpload";
import { InputTextField } from "../ui/InputTextField";
import {
  fieldTypeNeedsOptions,
  initialTeamFieldForm,
  teamFieldTypeOptions,
  toTeamFieldRequest,
  validateTeamFieldForm,
  type TeamFieldFormValues,
} from "../domain/teamFieldForms";

export default function HackathonDetails() {
  const { hackathonId } = useParams();
  const dispatch = useAppDispatch();
  const hackathon = useAppSelector((state) => state.hackathons.current);
  const fields = useAppSelector((state) => state.hackathons.fields);
  const user = useAppSelector((state) => state.auth.user);
  const [rulesFile, setRulesFile] = useState<File | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [fieldForm, setFieldForm] = useState<TeamFieldFormValues>(initialTeamFieldForm);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!hackathonId) return;
    void dispatch(fetchHackathon(hackathonId));
    void dispatch(fetchFormFields({ hackathonId, scope: "team" }));
  }, [dispatch, hackathonId]);

  const access = explainHackathonManagementAccess(user, hackathon);

  const handleRulesUpload = async () => {
    if (!hackathon) return;
    const validation = validateRulesPdf(rulesFile);
    if (!validation.valid) {
      setRulesError(validation.error);
      return;
    }

    await dispatch(uploadHackathonRules({ hackathonId: hackathon.id, file: rulesFile as File }));
    setRulesFile(null);
    setRulesError(null);
  };

  const updateFieldForm = (patch: Partial<TeamFieldFormValues>) => {
    setFieldForm((prev) => ({ ...prev, ...patch }));
  };

  const handleCreateField = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hackathon) return;

    const validation = validateTeamFieldForm(fieldForm);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    const created = await dispatch(createFormField({
      hackathonId: hackathon.id,
      field: toTeamFieldRequest(fieldForm, fields.length + 1),
    })).unwrap();

    if (created) {
      setFieldForm(initialTeamFieldForm);
      setFieldErrors([]);
    }
  };

  const handleToggleField = async (fieldId: string, patch: { required?: boolean; visible?: boolean }) => {
    if (!hackathon) return;
    await dispatch(updateFormField({ hackathonId: hackathon.id, fieldId, patch }));
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!hackathon) return;
    await dispatch(deleteFormField({ hackathonId: hackathon.id, fieldId }));
  };

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
                <Stack spacing={1}>
                  <Typography variant="h5">Параметры команды</Typography>
                  <Typography>Размер команды: {hackathon.minTeamSize}-{hackathon.maxTeamSize}</Typography>
                  <Typography>Полей формы: {fields.length}</Typography>
                </Stack>
              </CardContent>
            </Card>

            <Alert severity={access.allowed ? "success" : "info"}>{access.reason}</Alert>

            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
                    <Box>
                      <Typography variant="h5">PDF-регламент</Typography>
                      {hackathon.rulesFile ? (
                        <Typography color="text.secondary">
                          {hackathon.rulesFile.originalName} · {Math.ceil(hackathon.rulesFile.sizeBytes / 1024)} КБ
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">Регламент еще не загружен</Typography>
                      )}
                    </Box>
                    {hackathon.rulesFile && (
                      <Button
                        component="a"
                        href={hackathon.rulesFile.url}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        startIcon={<PictureAsPdfOutlinedIcon />}
                      >
                        Открыть PDF
                      </Button>
                    )}
                  </Box>

                  {access.allowed && (
                    <Stack spacing={1.5}>
                      {rulesError && <Alert severity="error">{rulesError}</Alert>}
                      <Button variant="outlined" component="label" startIcon={<CloudUploadOutlinedIcon />}>
                        Выбрать PDF
                        <input
                          hidden
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(event) => {
                            setRulesFile(event.target.files?.[0] ?? null);
                            setRulesError(null);
                          }}
                        />
                      </Button>
                      {rulesFile && (
                        <Typography color="text.secondary">{rulesFile.name}</Typography>
                      )}
                      <Button
                        variant="contained"
                        disabled={!rulesFile}
                        onClick={() => {
                          void handleRulesUpload();
                        }}
                      >
                        Загрузить регламент
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h5">Поля команды</Typography>
                    <Typography color="text.secondary">Динамические поля заявки команды на этот хакатон</Typography>
                  </Box>

                  {access.allowed && (
                    <Stack component="form" spacing={2} onSubmit={handleCreateField}>
                      {fieldErrors.length > 0 && (
                        <Alert severity="error">{fieldErrors.join(". ")}</Alert>
                      )}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <InputTextField
                          label="Ключ"
                          value={fieldForm.key}
                          onChange={(event) => updateFieldForm({ key: event.target.value })}
                        />
                        <InputTextField
                          label="Подпись"
                          value={fieldForm.label}
                          onChange={(event) => updateFieldForm({ label: event.target.value })}
                        />
                      </Stack>
                      <InputTextField
                        label="Описание"
                        value={fieldForm.description}
                        onChange={(event) => updateFieldForm({ description: event.target.value })}
                      />
                      <FormControl fullWidth>
                        <InputLabel id="team-field-type-label">Тип поля</InputLabel>
                        <Select
                          labelId="team-field-type-label"
                          label="Тип поля"
                          value={fieldForm.type}
                          onChange={(event) => updateFieldForm({ type: event.target.value as TeamFieldFormValues["type"] })}
                        >
                          {teamFieldTypeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {fieldTypeNeedsOptions(fieldForm.type) && (
                        <InputTextField
                          label="Варианты"
                          value={fieldForm.optionsText}
                          onChange={(event) => updateFieldForm({ optionsText: event.target.value })}
                          multiline
                          minRows={3}
                        />
                      )}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <FormControlLabel
                          control={<Checkbox checked={fieldForm.required} onChange={(event) => updateFieldForm({ required: event.target.checked })} />}
                          label="Обязательное"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={fieldForm.visible} onChange={(event) => updateFieldForm({ visible: event.target.checked })} />}
                          label="Видимое"
                        />
                      </Stack>
                      <Button type="submit" variant="contained" startIcon={<AddCircleOutlineIcon />}>
                        Добавить поле
                      </Button>
                    </Stack>
                  )}

                  <Stack spacing={1.5}>
                    {fields.map((field) => (
                      <Box
                        key={field.id}
                        sx={(theme) => ({
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          p: 2,
                          background: theme.palette.mode === "dark" ? "rgba(7, 27, 45, 0.42)" : "rgba(255, 255, 255, 0.42)",
                        })}
                      >
                        <Stack spacing={1.5}>
                          <Box display="flex" justifyContent="space-between" gap={1} flexWrap="wrap">
                            <Box>
                              <Typography fontWeight={700}>{field.label}</Typography>
                              <Typography variant="body2" color="text.secondary">{field.key} · {field.type}</Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip label={field.required ? "Обязательное" : "Необязательное"} color={field.required ? "primary" : "default"} />
                              <Chip label={field.visible ? "Видимое" : "Скрыто"} color={field.visible ? "secondary" : "default"} />
                            </Stack>
                          </Box>
                          {field.description && <Typography color="text.secondary">{field.description}</Typography>}
                          {field.options.length > 0 && (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {field.options.map((option) => (
                                <Chip key={option.value} label={option.label} />
                              ))}
                            </Stack>
                          )}
                          {access.allowed && (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  void handleToggleField(field.id, { required: !field.required });
                                }}
                              >
                                {field.required ? "Сделать необязательным" : "Сделать обязательным"}
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  void handleToggleField(field.id, { visible: !field.visible });
                                }}
                              >
                                {field.visible ? "Скрыть" : "Показать"}
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => {
                                  void handleDeleteField(field.id);
                                }}
                              >
                                Удалить
                              </Button>
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

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
