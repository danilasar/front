import { useEffect, useState } from "react";
import { AlertCircle, FileText, Plus, Trash2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
    <GridBackGroundLayout className="py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {hackathon && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <Badge variant={hackathon.status === "active" ? "secondary" : "default"}>
                      {hackathon.status}
                    </Badge>
                    <div>
                      <h1 className="text-3xl font-bold tracking-normal md:text-4xl">{hackathon.title}</h1>
                      <p className="mt-2 max-w-3xl text-muted-foreground">{hackathon.description}</p>
                    </div>
                  </div>
                  <div className="grid min-w-52 grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border bg-muted/50 p-3">
                      <div className="text-muted-foreground">Команда</div>
                      <div className="text-lg font-bold">{hackathon.minTeamSize}-{hackathon.maxTeamSize}</div>
                    </div>
                    <div className="rounded-md border bg-muted/50 p-3">
                      <div className="text-muted-foreground">Поля</div>
                      <div className="text-lg font-bold">{fields.length}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{access.allowed ? "Управление доступно" : "Режим просмотра"}</AlertTitle>
              <AlertDescription>{access.reason}</AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>PDF-регламент</CardTitle>
                    <CardDescription>
                      {hackathon.rulesFile
                        ? `${hackathon.rulesFile.originalName} · ${Math.ceil(hackathon.rulesFile.sizeBytes / 1024)} КБ`
                        : "Регламент еще не загружен"}
                    </CardDescription>
                  </div>
                  {hackathon.rulesFile && (
                    <Button asChild variant="outline">
                      <a href={hackathon.rulesFile.url} target="_blank" rel="noreferrer">
                        <FileText className="h-4 w-4" />
                        Открыть PDF
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              {access.allowed && (
                <CardContent className="space-y-3">
                  {rulesError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{rulesError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button variant="outline" asChild>
                      <label>
                        <Upload className="h-4 w-4" />
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
                      </label>
                    </Button>
                    {rulesFile && <p className="text-sm text-muted-foreground">{rulesFile.name}</p>}
                    <Button disabled={!rulesFile} onClick={() => void handleRulesUpload()}>
                      Загрузить регламент
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Поля команды</CardTitle>
                <CardDescription>Динамические поля заявки команды на этот хакатон</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {access.allowed && (
                  <form className="space-y-4 rounded-lg border bg-muted/30 p-4" onSubmit={handleCreateField}>
                    {fieldErrors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{fieldErrors.join(". ")}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>
                    <InputTextField
                      label="Описание"
                      value={fieldForm.description}
                      onChange={(event) => updateFieldForm({ description: event.target.value })}
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold">Тип поля</label>
                      <Select
                        value={fieldForm.type}
                        onValueChange={(value) => updateFieldForm({ type: value as TeamFieldFormValues["type"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {teamFieldTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {fieldTypeNeedsOptions(fieldForm.type) && (
                      <InputTextField
                        label="Варианты"
                        value={fieldForm.optionsText}
                        multiline
                        minRows={3}
                        onChange={(event) => updateFieldForm({ optionsText: event.target.value })}
                      />
                    )}
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={fieldForm.required}
                          onChange={(event) => updateFieldForm({ required: event.target.checked })}
                        />
                        Обязательное
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={fieldForm.visible}
                          onChange={(event) => updateFieldForm({ visible: event.target.checked })}
                        />
                        Видимое
                      </label>
                    </div>
                    <Button type="submit">
                      <Plus className="h-4 w-4" />
                      Добавить поле
                    </Button>
                  </form>
                )}

                <div className="space-y-3">
                  {fields.map((field) => (
                    <div key={field.id} className="rounded-lg border bg-background/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-bold">{field.label}</h3>
                          <p className="text-sm text-muted-foreground">{field.key} · {field.type}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={field.required ? "default" : "outline"}>
                            {field.required ? "Обязательное" : "Необязательное"}
                          </Badge>
                          <Badge variant={field.visible ? "secondary" : "outline"}>
                            {field.visible ? "Видимое" : "Скрыто"}
                          </Badge>
                        </div>
                      </div>
                      {field.description && <p className="mt-3 text-sm text-muted-foreground">{field.description}</p>}
                      {field.options.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {field.options.map((option) => (
                            <Badge key={option.value} variant="outline">{option.label}</Badge>
                          ))}
                        </div>
                      )}
                      {access.allowed && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggleField(field.id, { required: !field.required })}
                          >
                            {field.required ? "Сделать необязательным" : "Сделать обязательным"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggleField(field.id, { visible: !field.visible })}
                          >
                            {field.visible ? "Скрыть" : "Показать"}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDeleteField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link to={`/hackathons/${hackathon.id}/teams`}>Команды</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/hackathons">Назад к списку</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </GridBackGroundLayout>
  );
}
