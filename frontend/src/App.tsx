import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { AddBusinessPage } from "./pages/AddBusinessPage";
import { BusinessesPage } from "./pages/BusinessesPage";
import { ChatLogsPage } from "./pages/ChatLogsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LiveSimulationPage } from "./pages/LiveSimulationPage";

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/businesses" element={<BusinessesPage />} />
        <Route path="/add-business" element={<AddBusinessPage />} />
        <Route path="/chat-logs" element={<ChatLogsPage />} />
        <Route path="/live" element={<LiveSimulationPage />} />
      </Routes>
    </AppLayout>
  );
}

