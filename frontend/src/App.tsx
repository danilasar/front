import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import { routes } from "./routes";
import { useEffect, useState } from "react";
import { ErrorModal } from "./components/ErrorModal";
import { AuthWrapper } from "./components/wrappers/AuthWrapper";
import { GuestWrapper } from "./components/wrappers/GuestWrapper";
import { CommonWrapper } from "./components/wrappers/CommonWrapper";
import { GuardWrapper } from "./components/wrappers/GuardWrapper";
import { RoleWrapper } from "./components/wrappers/RoleWrapper";
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
    <ColorModeContext.Provider value={{ toggleTheme }}>
      <div className={darkMode ? "dark" : ""}>
        <NavBar />
        <ErrorModal />
        <CommonWrapper>
          <AuthWrapper>
            <Routes>
              <Route>
                {routes
                  .filter((router) =>
                    router.isPrivate === undefined
                    && router.isGuest === undefined)
                  .map((router) =>
                    <Route
                      key={router.path}
                      path={router.path}
                      element={router.element} />

                  )}
              </Route>

              <Route element={<GuestWrapper />}>
                {routes
                  .filter((router) => router.isGuest === true)
                  .map((router) =>
                    <Route
                      key={router.path}
                      path={router.path}
                      element={router.element} />
                  )}
              </Route>

              <Route element={<GuardWrapper />}>
                {routes
                  .filter((router) => router.isPrivate === true && router.roles === undefined)
                  .map((router) =>
                    <Route
                      key={router.path}
                      path={router.path}
                      element={router.element} />

                  )}
              </Route>

              {routes
                .filter((router) => router.isPrivate === true && router.roles !== undefined)
                .map((router) => (
                  <Route key={router.path} element={<RoleWrapper roles={router.roles ?? []} />}>
                    <Route path={router.path} element={router.element} />
                  </Route>
                ))}
            </Routes>
          </AuthWrapper>
        </CommonWrapper>
      </div>
    </ColorModeContext.Provider >
  );
}

export default App;
