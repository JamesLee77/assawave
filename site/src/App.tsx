import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/site/Layout";
import Home from "./pages/Home";
import Legal from "./pages/Legal";

export default function App() {
  return (
    <Routes>
      {/* 마케팅 라우트 — 공유 Layout(다크 기본 + 라이트 토글) */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="whitepaper" element={<Legal title="Whitepaper" />} />
        <Route path="terms" element={<Legal title="Terms of Service" />} />
        <Route path="privacy" element={<Legal title="Privacy Policy" />} />
        <Route path="disclaimer" element={<Legal title="Disclaimer" />} />
        {/* 레거시 스텁 — 홈 앵커로 리다이렉트 */}
        <Route path="tokenomics" element={<Navigate to="/#tokenomics" replace />} />
        <Route path="roadmap" element={<Navigate to="/#roadmap" replace />} />
      </Route>
    </Routes>
  );
}
