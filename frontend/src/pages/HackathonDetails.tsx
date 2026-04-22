import { useEffect, useState } from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchFormFields, fetchHackathon, uploadHackathonRules } from "../store/hackathons";
import { explainHackathonManagementAccess } from "../domain/access";
import { validateRulesPdf } from "../domain/rulesUpload";

export default function HackathonDetails() {
  const { hackathonId } = useParams();
  const dispatch = useAppDispatch();
  const hackathon = useAppSelector((state) => state.hackathons.current);
  const fields = useAppSelector((state) => state.hackathons.fields);
  const user = useAppSelector((state) => state.auth.user);
  const [rulesFile, setRulesFile] = useState<File | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);

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
