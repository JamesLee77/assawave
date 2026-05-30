import { useMemo } from "react";
import type { ReactNode } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { useTheme } from "../../lib/theme";

/**
 * RainbowKit modal theme follows our ThemeProvider so the connect/account
 * modals don't feel pasted on when the rest of the page swaps light/dark.
 *
 * Accent encodes the build env so the modal echoes the operator's mental
 * model: moss = mainnet (real), clay = testnet (rehearsal).
 */
export default function RainbowKitThemed({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  // ASSA WAVE Brand Coral Red (#c81e14): Passes WCAG AA contrast with white text
  const accent = "#c81e14"; 
  const theme = useMemo(
    () =>
      isDark
        ? darkTheme({
            accentColor: accent,
            accentColorForeground: "#ffffff",
            borderRadius: "large",
            fontStack: "system",
          })
        : lightTheme({
            accentColor: accent,
            accentColorForeground: "#ffffff",
            borderRadius: "large",
            fontStack: "system",
          }),
    [isDark, accent],
  );
  return (
    <RainbowKitProvider theme={theme} locale="en-US">
      {children}
    </RainbowKitProvider>
  );
}
