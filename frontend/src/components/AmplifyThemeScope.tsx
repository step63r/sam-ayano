import React from "react";
import { ThemeProvider, defaultDarkModeOverride, type Theme } from "@aws-amplify/ui-react";
import { useTheme } from "next-themes";

/**
 * Amplify UI の部品（AccountSettings など）をアプリの配色に合わせるためのテーマ。
 * ブランド色は Tailwind の indigo に寄せ、角丸は本アプリの部品に合わせて大きめにしている
 */
const amplifyTheme: Theme = {
  name: "tsundoku",
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: "#eef2ff" },
          20: { value: "#e0e7ff" },
          40: { value: "#a5b4fc" },
          60: { value: "#6366f1" },
          80: { value: "#4f46e5" },
          90: { value: "#4338ca" },
          100: { value: "#3730a3" },
        },
      },
    },
    radii: {
      small: { value: "0.75rem" },
      medium: { value: "1rem" },
      large: { value: "1.5rem" },
    },
  },
  overrides: [defaultDarkModeOverride],
};

/**
 * Amplify UI の部品を、アプリのライト/ダーク設定に追従させる範囲
 * Amplify の部品は独自の配色を持つため、これで囲まないとダークモードで文字が読めなくなる
 */
const AmplifyThemeScope: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resolvedTheme } = useTheme();

  return (
    <ThemeProvider theme={amplifyTheme} colorMode={resolvedTheme === "dark" ? "dark" : "light"}>
      {children}
    </ThemeProvider>
  );
};

export default AmplifyThemeScope;
