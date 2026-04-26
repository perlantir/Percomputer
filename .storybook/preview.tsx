import type { Preview } from "@storybook/react";
import React from "react";
import { ThemeProvider } from "next-themes";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0a0a0a" },
      ],
    },
    themes: {
      default: "dark",
      list: [
        { name: "light", class: "light", color: "#ffffff" },
        { name: "dark", class: "dark", color: "#0a0a0a" },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.parameters.themes?.default ?? "dark";
      return (
        <ThemeProvider attribute="class" defaultTheme={theme} enableSystem>
          <div className="min-h-[100px] p-4">
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
