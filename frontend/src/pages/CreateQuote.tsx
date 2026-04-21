import { useForm, type RegisterOptions, type SubmitHandler } from "react-hook-form";
import { CustomForm } from "../ui/CustomForm";
import { InputTextField } from "../ui/InputTextField";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { Typography } from "@mui/material";
import { useAppDispatch } from "../store/hooks";
import { createQuote } from "../store/quote";
import { useNavigate } from "react-router-dom";

export default function CreateQuote() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteFormValue>();

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const onSubmit: SubmitHandler<QuoteFormValue> = async (data) => {
    await dispatch(createQuote(data.text));
    navigate("/quotes")
  };

  return (
    <GridBackGroundLayout>
      <Typography variant="h3" sx={{ padding: 1 }}>
        Добавьте вашу любимую цитату!
      </Typography>
      <CustomForm onSubmit={handleSubmit(onSubmit)} buttonText="Создать цитату">
        <InputTextField
          key={field.name}
          label={field.label}
          type={field.type}
          margin="normal"
          {...register(field.name, field.rules)}
          error={!!errors[field.name]}
          helperText={errors[field.name]?.message as string}
          multiline
          minRows={6}
          maxRows={10}
          sx={{
            width: "calc(100% + 200px)",
          }}
        />
      </CustomForm>
    </GridBackGroundLayout>
  );
}

type QuoteFormValue = {
  text: string;
};

type QuoteFormField = {
  name: keyof QuoteFormValue;
  label: string;
  type: string;
  rules: RegisterOptions<QuoteFormValue>;
};

const field: QuoteFormField =
{
  name: "text",
  label: "Введите цитату",
  type: "text",
  rules: {
    required: "Введите цитату",
    minLength: {
      value: 3,
      message: "Минимум 3 символа",
    },
  },
};
