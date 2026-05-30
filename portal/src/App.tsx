import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Stake from "./pages/Stake";
import Settings from "./pages/Settings";
import Sale from "./pages/Sale";
import Vesting from "./pages/Vesting";
import Migrate from "./pages/Migrate";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="stake" element={<Stake />} />
        <Route path="sale" element={<Sale />} />
        <Route path="vesting" element={<Vesting />} />
        <Route path="migrate" element={<Migrate />} />
        <Route path="settings" element={<Settings />} />
        {/* Fallback redirect */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
