import { CenterFullScreenLayout, type CenterFullScreenLaoutProps } from "./CenterFullScreenLayout";

export const GridBackGroundLayout = ({ children, className, ...props }: CenterFullScreenLaoutProps) => {
  return (
    <CenterFullScreenLayout 
      className={`
        relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_32rem),linear-gradient(180deg,rgba(255,255,255,0.72),transparent_22rem)]
        dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_32rem),linear-gradient(180deg,rgba(15,23,42,0.58),transparent_22rem)]
        after:absolute after:inset-0 after:pointer-events-none after:z-0
        after:bg-[url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 40H0' stroke='%23888' stroke-width='0.5' stroke-opacity='0.1'/%3E%3C/svg%3E")]
        dark:after:bg-[url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 40H0' stroke='%23fff' stroke-width='0.5' stroke-opacity='0.05'/%3E%3C/svg%3E")]
        ${className || ""}
      `}
      {...props}
    >
      <div className="relative z-10 w-full">
        {children}
      </div>
    </CenterFullScreenLayout>
  )
}
