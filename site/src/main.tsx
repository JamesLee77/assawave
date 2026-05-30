import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter } from "react-router-dom";
import "./lib/i18n";
import App from "./App";
import { config } from "./lib/wagmi";
import ThemeProvider from "./components/site/ThemeProvider";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {/* accent = brand-pressed(#C81E14): RainbowKit 버튼 흰 글자 AA 보장 */}
          <RainbowKitProvider theme={darkTheme({ accentColor: "#c81e14" })} locale="en-US">
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
