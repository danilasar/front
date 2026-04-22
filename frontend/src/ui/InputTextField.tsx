import { Input } from "../components/ui/input";
import React from "react";
import { cn } from "../lib/utils";

interface InputTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  multiline?: boolean;
  minRows?: number;
}

export const InputTextField = ({ label, className, multiline, minRows, ...props }: InputTextFieldProps) => {
  const fieldClassName = cn(
    "w-full border border-input bg-background/80 shadow-sm backdrop-blur-sm",
    className,
  );

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>}
      {multiline ? (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={minRows}
          className={cn(
            "flex min-h-24 rounded-md px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            fieldClassName,
          )}
        />
      ) : (
        <Input {...props} className={fieldClassName} />
      )}
    </div>
  );
}
