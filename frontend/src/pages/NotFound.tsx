import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";

export default function NotFound() {
  return (
    <GridBackGroundLayout>
      <h1 className="text-3xl font-bold mb-4">Страница не найдена</h1>
      <Button asChild>
        <Link to="/">На главную</Link>
      </Button>
    </GridBackGroundLayout>
  );
}
