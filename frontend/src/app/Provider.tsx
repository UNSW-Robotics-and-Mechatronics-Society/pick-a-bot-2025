"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/get-query-client";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { system } from "@/lib/theme";



const AppThemeProvider = (props: { children: React.ReactNode }) => {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange >
        {props.children}
      </ThemeProvider>
    </ChakraProvider>
  )
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.REACT_APP_SHOW_DEV_TOOLS ? <ReactQueryDevtools /> : null}
      </QueryClientProvider>
    </AppThemeProvider>
  );
}
