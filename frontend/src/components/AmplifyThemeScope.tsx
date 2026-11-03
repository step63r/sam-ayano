import React from "react";
import { ThemeProvider, type Theme } from "@aws-amplify/ui-react";

/**
 * 配色の指定は、アプリ本体(index.css)の CSS 変数をそのまま参照する。
 * ライト/ダークの切り替えは `.dark` クラスで CSS 変数が入れ替わることで自動的に追従するため、
 * Amplify 側のダークモード設定(colorMode / defaultDarkModeOverride)は使わない。
 * 「primary を何%透過するか」で濃淡を作っているのは、ブランド色の段階(10〜100)を 1 色から導くため。
 */
const tint = (percent: number) => ({ value: `color-mix(in oklch, var(--primary) ${percent}%, transparent)` });

const amplifyTheme: Theme = {
  name: "tsundoku",
  tokens: {
    colors: {
      brand: {
        primary: {
          10: tint(10),
          20: tint(18),
          40: tint(45),
          60: tint(75),
          80: { value: "var(--primary)" },
          90: { value: "color-mix(in oklch, var(--primary) 88%, black)" },
          100: { value: "color-mix(in oklch, var(--primary) 76%, black)" },
        },
      },
      font: {
        primary: { value: "var(--foreground)" },
        secondary: { value: "var(--muted-foreground)" },
        tertiary: { value: "var(--muted-foreground)" },
        interactive: { value: "var(--primary)" },
        // ブランド色のボタンの文字色
        inverse: { value: "var(--primary-foreground)" },
        error: { value: "var(--destructive)" },
      },
      background: {
        primary: { value: "transparent" },
        secondary: { value: "var(--muted)" },
        tertiary: { value: "var(--accent)" },
      },
      border: {
        primary: { value: "var(--input)" },
        secondary: { value: "var(--border)" },
        tertiary: { value: "var(--border)" },
        focus: { value: "var(--ring)" },
        error: { value: "var(--destructive)" },
      },
    },
    fonts: {
      default: {
        variable: { value: "var(--app-font-sans)" },
        static: { value: "var(--app-font-sans)" },
      },
    },
    radii: {
      small: { value: "0.75rem" },
      medium: { value: "1rem" },
      large: { value: "1.5rem" },
    },
    components: {
      // 外枠・影・背景は、呼び出し側のガラスのカードに任せる
      authenticator: {
        router: {
          borderWidth: { value: "0" },
          boxShadow: { value: "none" },
          backgroundColor: { value: "transparent" },
        },
      },
      fieldcontrol: {
        borderRadius: { value: "var(--radius-xl)" },
        // 入力欄は、アプリ本体の入力欄と同じく、ガラスの上で沈んで見える半透明にする
        color: { value: "var(--foreground)" },
      },
      // ボタンの背景は brand.primary の段階ではなく、既定の青緑が直接指定されているため、ここで明示する
      button: {
        borderRadius: { value: "var(--radius-4xl)" },
        primary: {
          backgroundColor: { value: "var(--primary)" },
          color: { value: "var(--primary-foreground)" },
          borderColor: { value: "transparent" },
          _hover: {
            backgroundColor: { value: "color-mix(in oklch, var(--primary) 88%, black)" },
            color: { value: "var(--primary-foreground)" },
            borderColor: { value: "transparent" },
          },
          _focus: {
            backgroundColor: { value: "color-mix(in oklch, var(--primary) 88%, black)" },
            color: { value: "var(--primary-foreground)" },
            borderColor: { value: "transparent" },
            boxShadow: { value: "0 0 0 3px color-mix(in oklch, var(--ring) 50%, transparent)" },
          },
          _active: {
            backgroundColor: { value: "color-mix(in oklch, var(--primary) 76%, black)" },
            color: { value: "var(--primary-foreground)" },
            borderColor: { value: "transparent" },
          },
        },
      },
      // チェックボックスの塗りも、ボタンと同じく既定の青緑が直接指定されているため、ここで明示する
      checkbox: {
        icon: {
          backgroundColor: { value: "var(--primary)" },
        },
      },
      // 既定の見出しは大きすぎて、「パスワードをリセット」などが折り返してしまう
      heading: {
        3: {
          fontSize: { value: "1.25rem" },
          fontWeight: { value: "700" },
        },
      },
      tabs: {
        item: {
          fontWeight: { value: "600" },
        },
      },
    },
  },
};

/**
 * Amplify UI の部品（Authenticator、AccountSettings など）を、アプリの配色に合わせる範囲。
 * Amplify の部品は独自の配色を持つため、これで囲まないと、ダークモードなどで文字が読めなくなる
 */
const AmplifyThemeScope: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={amplifyTheme}>{children}</ThemeProvider>
);

export default AmplifyThemeScope;
