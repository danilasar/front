import { useForm, type FieldValues, type Path, type RegisterOptions, type SubmitHandler } from "react-hook-form";
import { CustomForm } from "../ui/CustomForm";
import { InputTextField } from "../ui/InputTextField";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { Link } from "react-router-dom";

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
      <h1 className="text-3xl font-bold mb-8">
        {title}
      </h1>
      <CustomForm onSubmit={handleSubmit(onSubmit)} buttonText={submitButtonText}>
        {fields.map((field) => (
          <div key={field.name} className="w-full mb-4">
            <InputTextField
              label={field.label}
              type={field.type}
              {...register(field.name, field.rules)}
            />
            {errors[field.name] && (
              <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message as string}</p>
            )}
          </div>
        ))}
      </CustomForm>
      <p className="mt-4 text-center">
        {switchText}{" "}
        <Link to={switchTo} className="text-primary hover:underline">{switchLinkText}</Link>
      </p>
    </GridBackGroundLayout >
  );
}
