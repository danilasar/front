import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchActiveHackathon } from "../store/hackathons";

export default function Home() {
  const dispatch = useAppDispatch();
  const active = useAppSelector((state) => state.hackathons.active);

  useEffect(() => {
    void dispatch(fetchActiveHackathon());
  }, [dispatch]);

  return (
    <GridBackGroundLayout className="min-w-full text-center py-14">
      <Card className="w-full max-w-5xl mx-2">
        <CardContent className="p-6 md:p-12 relative">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10" />
          <div className="flex flex-col items-center gap-4 relative">
            {active && (
              <div className="flex flex-col items-center gap-2 my-6">
                <Badge variant="secondary">Активный хакатон</Badge>
                <h3 className="text-2xl font-bold">{active.title}</h3>
                <p className="text-muted-foreground">{active.description}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button asChild>
                <Link to="/hackathons">
                  Смотреть хакатоны
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/profile">
                  Личный кабинет
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </GridBackGroundLayout>
  );
}
