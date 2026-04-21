import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Button
} from "@mui/material"
import { Link, useNavigate } from "react-router-dom"
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { logout } from "../store/auth"

export default function Profile() {
  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  if (!user) {
    return (
      <GridBackGroundLayout >
        <Typography>Пользователь не найден</Typography>
      </GridBackGroundLayout>
    )
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  return (
    <GridBackGroundLayout >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mb={2}
            >
              <Avatar sx={(theme) => {
                return {
                  width: 80,
                  height: 80,
                  mb: 1,
                  background: theme.palette.secondary.main,
                }
              }}>
                {user.fullName[0]}
              </Avatar>

              <Typography variant="h5">
                {user.fullName}
              </Typography>

              <Typography color="text.secondary">
                {user.email}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography>
                <b>ID:</b> {user.id}
              </Typography>

              <Typography>
                <b>Роль:</b> {user.role}
              </Typography>

              <Typography>
                <b>Почта:</b> {user.email}
              </Typography>

              <Typography>
                <b>Учебное заведение:</b> {user.education ?? "Не указано"}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                key={"/"}
                component={Link}
                to={"/"}
              >
                На главную
              </Button>

              <Button
                variant="contained"
                color="error"
                onClick={handleLogout}
              >
                Выйти
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </GridBackGroundLayout>
  )
}
