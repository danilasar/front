import { TextField, type TextFieldProps } from "@mui/material";

export const InputTextField = ({ sx, ...props }: TextFieldProps) => {
  return (
    <TextField
      sx={[(theme) => {
        const backgroundColor = theme.palette.background.default;
        const fontColor = theme.palette.text.primary;
        return {
          background: backgroundColor,
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
