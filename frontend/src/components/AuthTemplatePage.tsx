import { useForm, type FieldValues, type Path, type RegisterOptions, type SubmitHandler } from "react-hook-form";
import { CustomForm } from "../ui/CustomForm";
import { InputTextField } from "../ui/InputTextField";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type AuthTemplatePageProps<T extends FieldValues> = {
  title: string;
  fields: AuthFieldConfig<T>[];
  onSubmit: SubmitHandler<T>;
  submitButtonText: string;
  switchText: string;
  switchLinkText: string;
  switchTo: string;
}

export type AuthFieldConfig<T extends FieldValues> = {
  name: Path<T>,
  label: string,
  type: string,
  rules: RegisterOptions<T>,
}

export default function AuthTemplatePage<T extends FieldValues>({
  title,
  fields,
  onSubmit,
  submitButtonText,
  switchTo,
  switchText,
  switchLinkText
}: AuthTemplatePageProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<T>();

  return (
    <GridBackGroundLayout>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription>Единый аккаунт для участия и управления хакатонами</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomForm onSubmit={handleSubmit(onSubmit)} buttonText={submitButtonText}>
            {fields.map((field) => (
              <div key={field.name} className="mb-4 w-full">
                <InputTextField
                  label={field.label}
                  type={field.type}
                  {...register(field.name, field.rules)}
                />
                {errors[field.name] && (
                  <p className="mt-1 text-sm text-destructive">{errors[field.name]?.message as string}</p>
                )}
              </div>
            ))}
          </CustomForm>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {switchText}{" "}
            <Link to={switchTo} className="font-semibold text-primary hover:underline">{switchLinkText}</Link>
          </p>
        </CardContent>
      </Card>
    </GridBackGroundLayout >
  );
}
