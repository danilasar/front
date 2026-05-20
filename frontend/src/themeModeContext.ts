import { createContext } from "react";

export const ColorModeContext = createContext({
  darkMode: false,
  toggleTheme: () => { },
});
