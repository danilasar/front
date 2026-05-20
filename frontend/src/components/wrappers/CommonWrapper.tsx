import type { ReactNode } from "react";
import { useAppSelector } from "../../store/hooks";

export const CommonWrapper = ({ children }: { children: ReactNode }) => {
  const isLoading = useAppSelector((state) => state.settings.isLoading);

  return (
    <div className="relative">
      <div
        className={`transition-all duration-300 ${
          isLoading ? "blur-sm pointer-events-none" : ""
        }`}
      >
        {children}
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};
