import { useEffect } from "react";
import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchTeams, updateTeamStatus } from "../store/teams";
import type { TeamStatus } from "../domain/types";

const nextStatus: TeamStatus = "admitted";

export default function Teams() {
  const { hackathonId } = useParams();
  const dispatch = useAppDispatch();
  const teams = useAppSelector((state) => state.teams.items);

  useEffect(() => {
    if (!hackathonId) return;
    void dispatch(fetchTeams({ hackathonId }));
  }, [dispatch, hackathonId]);

  return (
    <GridBackGroundLayout sx={{ py: 14 }}>
      <Stack spacing={3} sx={{ width: "min(900px, 100%)", px: 2 }}>
        <Typography variant="h3">Команды</Typography>
        {teams.map((team) => (
          <Card key={team.id}>
            <CardContent>
              <Stack spacing={1}>
                <Chip label={team.status} />
                <Typography variant="h5">{team.name}</Typography>
                <Typography color="text.secondary">Участников: {team.members.length}</Typography>
              </Stack>
            </CardContent>
            <CardActions>
              <Button
                disabled={!hackathonId || team.status === nextStatus}
                onClick={() => {
                  if (hackathonId) {
                    void dispatch(updateTeamStatus({ hackathonId, teamId: team.id, status: nextStatus }));
                  }
                }}
              >
                Допустить
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </GridBackGroundLayout>
  );
}
