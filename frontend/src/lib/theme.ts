import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineTextStyles,
} from "@chakra-ui/react";

export const textStyles = defineTextStyles({
  body: {
    description: "Responsive body text",
    value: {
      fontSize: {
        base: "0.8rem",
        md: "1rem",
        lg: "1.125rem",
      },
      lineHeight: "1.6",
    },
  },
});

const customConfig = defineConfig({
  strictTokens: true,
  globalCss: {
    body: {
      bg: {
        base: "gray.100",
        _dark: "gray.950",
      },
      minW: "xs",
      minH: "100dvh",
      color: {
        base: "gray.800",
        _dark: "gray.200",
      },
    },
    Button: {},
  },
  theme: {
    tokens: {
      fonts: {
        body: { value: `"Anta", sans-serif` },
        heading: { value: `"Audiowide"` },
      },
    },
    textStyles,
  },
});

export const system = createSystem(defaultConfig, customConfig);
