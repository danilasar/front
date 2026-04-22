import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchHackathons } from "../store/hackathons";
import { canCreateHackathon } from "../domain/access";

export default function Hackathons() {
  const dispatch = useAppDispatch();
  const hackathons = useAppSelector((state) => state.hackathons.items);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    void dispatch(fetchHackathons());
  }, [dispatch]);

  return (
    <GridBackGroundLayout className="py-14">
      <div className="w-full max-w-5xl px-2 space-y-6">
        <Card>
          <CardContent className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <CardTitle className="text-3xl mb-2">Хакатоны</CardTitle>
              <CardDescription>Активные события, архив и черновики мероприятий</CardDescription>
            </div>
            {canCreateHackathon(user?.role) && (
              <Button asChild>
                <Link to="/admin">
                  Создать
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hackathons.map((hackathon) => (
            <Card key={hackathon.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg">{hackathon.title}</CardTitle>
                  <Badge variant={hackathon.status === "active" ? "secondary" : "default"}>
                    {hackathon.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="mb-4">{hackathon.description}</CardDescription>
                <p className="text-sm">
                  Команда: {hackathon.minTeamSize}-{hackathon.maxTeamSize} участников
                </p>
              </CardContent>
              <div className="px-6 pb-6 pt-0 flex gap-2">
                <Button asChild size="sm">
                  <Link to={`/hackathons/${hackathon.id}`}>
                    Подробнее
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/hackathons/${hackathon.id}/teams`}>
                    Команды
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </GridBackGroundLayout>
  );
}
