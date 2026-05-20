import type React from "react";

export type CenterFullScreenLaoutProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export const CenterFullScreenLayout = ({ children, className, ...props }: CenterFullScreenLaoutProps) => {
  return (
    <div 
      className={`min-h-screen flex items-center justify-center px-4 pb-10 pt-24 sm:pt-28 relative overflow-hidden ${className || ""}`}
      {...props}
    >
      <div className="flex flex-col items-center w-full">
        {children}
      </div>
    </div>
  )
}
