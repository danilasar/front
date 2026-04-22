import { Input } from "../components/ui/input";
import React from "react";

interface InputTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const InputTextField = ({ label, ...props }: InputTextFieldProps) => {
  return (
    <div className="w-full">
      {label && <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>}
      <Input {...props} className="w-full backdrop-blur-sm bg-white/60 dark:bg-slate-950/60 border border-white/30" />
    </div>
  );
}
