import type { SubmitHandler } from "react-hook-form";
import type { AuthFieldConfig } from "../components/AuthTemplatePage";
import AuthTemplatePage from "../components/AuthTemplatePage";
import { useAppDispatch } from "../store/hooks";
import { register } from "../store/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data: RegisterFormValues) => {
    const result = await dispatch(register({
      fullName: data.fullName,
      email: data.email,
      password: data.password
    })).unwrap();

    if (result) {
      navigate("/profile")
    }
  };

  return (
    <>
      <AuthTemplatePage
        title="Регистрация"
        fields={fields}
        onSubmit={onSubmit}
        submitButtonText="Создать аккаунт"
        switchTo="/login"
        switchLinkText="Войти"
        switchText="Есть аккаунт?"
      />
    </>
  );
}

type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
};

const fields: AuthFieldConfig<RegisterFormValues>[] = [
  {
    name: "fullName",
    label: "ФИО",
    type: "text",
    rules: {
      required: "Введите ФИО",
    }
  },
  {
    name: "email",
    label: "Почта",
    type: "email",
    rules: {
      required: "Введите почту",
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Некорректный почта",
      },
    },
  },
  {
    name: "password",
    label: "Пароль",
    type: "password",
    rules: {
      required: "Введите пароль",
      minLength: {
        value: 8,
        message: "Минимум 8 символов",
      },
    }
  }
]
