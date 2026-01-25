import { Route, Routes } from "react-router-dom";
import { Protected } from "./components/layout/Protected";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import Competitions from "./pages/Competitions";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Stats from "./pages/Stats";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/players"
        element={
          <Protected>
            <Players />
          </Protected>
        }
      />
      <Route
        path="/teams"
        element={
          <Protected>
            <Teams />
          </Protected>
        }
      />
      <Route
        path="/competitions"
        element={
          <Protected>
            <Competitions />
          </Protected>
        }
      />
      <Route
        path="/matches"
        element={
          <Protected>
            <Matches />
          </Protected>
        }
      />
      <Route
        path="/matches/:id"
        element={
          <Protected>
            <MatchDetail />
          </Protected>
        }
      />
      <Route
        path="/stats"
        element={
          <Protected>
            <Stats />
          </Protected>
        }
      />
      <Route
        path="*"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
    </Routes>
  );
}
