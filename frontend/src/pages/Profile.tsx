import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
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
      <GridBackGroundLayout>
        <p className="text-lg">Пользователь не найден</p>
      </GridBackGroundLayout>
    )
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  return (
    <GridBackGroundLayout>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-2xl font-bold text-white">
                {user.fullName[0]}
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl mb-1">{user.fullName}</CardTitle>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div><span className="font-semibold">ID:</span> {user.id}</div>
              <div><span className="font-semibold">Роль:</span> {user.role}</div>
              <div><span className="font-semibold">Почта:</span> {user.email}</div>
              <div><span className="font-semibold">Учебное заведение:</span> {user.education ?? "Не указано"}</div>
            </div>

            <div className="border-t pt-4 flex gap-2 justify-between">
              <Button asChild>
                <Link to="/">На главную</Link>
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Выйти
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </GridBackGroundLayout>
  )
}
