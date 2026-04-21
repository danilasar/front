import { TextField, type TextFieldProps } from "@mui/material";

export const InputTextField = ({ sx, ...props }: TextFieldProps) => {
  return (
    <TextField
      sx={[(theme) => {
        const fontColor = theme.palette.text.primary;
        return {
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            background: theme.palette.mode === "dark"
              ? "rgba(7, 27, 45, 0.62)"
              : "rgba(255, 255, 255, 0.68)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
          },
          "& .MuiInputBase-input": {
            color: fontColor,
          },
          "& .MuiInputLabel-root": {
            color: fontColor,
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: fontColor,
          },
        }
      },
      ...(Array.isArray(sx) ? sx : [sx])
      ]}
      fullWidth
      {...props}
    />
  );
}
