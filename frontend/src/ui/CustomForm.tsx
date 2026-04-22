import { Button } from "../components/ui/button";

export const CustomForm: React.FC<{
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  buttonText: string,
}> = ({ onSubmit, children, buttonText }) => {
  return (
    <form 
      onSubmit={onSubmit}
      className="flex flex-col items-center w-full max-w-[420px]"
    >
      {children}
      <Button
        type="submit"
        className="mt-2 w-full"
      >
        {buttonText}
      </Button>
    </form>
  );
}
