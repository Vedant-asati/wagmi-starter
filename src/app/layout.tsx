import "./globals.css";

// External
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { type ReactNode } from "react";
import { cookieToInitialState } from "wagmi";

// MUI
import theme from "@/theme";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
const inter = Inter({ subsets: ["latin"] });

// Internal
import { config } from "@/wagmi";
import { Providers } from "./providers";


export const metadata: Metadata = {
  title: "Task Master",
  description: "A task management app focused on productivity & collaboration.",
};

export default function RootLayout(props: { children: ReactNode }) {
  const getInitialState = () => {
    try {
      const cookie = headers().get("cookie");
      if (cookie) {
        const decodedCookie = decodeURIComponent(cookie);
        return cookieToInitialState(config, decodedCookie);
      }
    } catch (error) {
      console.error("Failed to parse cookie:", error);
    }
    return config; // Fallback to default config if parsing fails
  };

  const initialState = getInitialState();

  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Providers initialState={initialState}>{props.children}</Providers>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
