import type { SubmitHandler } from "react-hook-form";
import { login } from "../store/auth";
import { useAppDispatch } from "../store/hooks";
import type { AuthFieldConfig } from "../components/AuthTemplatePage";
import AuthTemplatePage from "../components/AuthTemplatePage";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    const result = await dispatch(login({
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
        title="Вход"
        fields={fields}
        onSubmit={onSubmit}
        submitButtonText="Войти в аккаунт"
        switchTo="/register"
        switchLinkText="Зарегистрироваться"
        switchText="Нет аккаунта?"
      />
    </>
  );
}

type LoginFormValues = {
  email: string;
  password: string;
};


const fields: AuthFieldConfig<LoginFormValues>[] = [
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
