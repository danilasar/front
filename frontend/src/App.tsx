import { Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import { routes } from "./routes";
import { useEffect, useState } from "react";
import { ErrorModal } from "./components/ErrorModal";
import { AuthWrapper } from "./components/wrappers/AuthWrapper";
import { CommonWrapper } from "./components/wrappers/CommonWrapper";
import { ColorModeContext } from "./themeModeContext";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev: boolean) => !prev)
  }

  return (
    <ColorModeContext.Provider value={{ darkMode, toggleTheme }}>
      <div className={`${darkMode ? "dark" : ""} min-h-screen bg-background text-foreground`}>
        <NavBar />
        <ErrorModal />
        <CommonWrapper>
          <AuthWrapper>
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  {...route}
                />
              ))}
            </Routes>
          </AuthWrapper>
        </CommonWrapper>
      </div>
    </ColorModeContext.Provider >
  );
}

export default App;
