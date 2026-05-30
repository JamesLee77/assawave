import { http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";

// Base 단일 체인(8453 mainnet / 84532 Sepolia). dev=Sepolia 우선 노출.
export const config = getDefaultConfig({
  appName: "ASSA WAVE",
  projectId,
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(
      import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    ),
    [base.id]: http(import.meta.env.VITE_BASE_RPC || "https://mainnet.base.org"),
  },
  ssr: false,
});
