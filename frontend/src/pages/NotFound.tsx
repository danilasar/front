import { Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";

export default function NotFound() {
  return (
    <GridBackGroundLayout>
      <Typography variant="h3" sx={{ mb: 2 }}>Страница не найдена</Typography>
      <Button component={Link} to="/" variant="contained">На главную</Button>
    </GridBackGroundLayout>
  );
}
