import React from "react";

/**
 * 利用規約・プライバシーポリシーの本文用の部品。
 * 本文は法的な文書のため、見た目だけをここで決め、文言は呼び出し側にそのまま残す
 */
type Props = { children: React.ReactNode };

/** 条の見出し（第1条（適用）など） */
export const LegalArticleTitle: React.FC<Props> = ({ children }) => (
  <h3 className="mt-4 text-base font-semibold">{children}</h3>
);

/** 本文の段落 */
export const LegalParagraph: React.FC<Props> = ({ children }) => (
  <p className="text-sm leading-relaxed">{children}</p>
);

/** 番号付きの項 */
export const LegalList: React.FC<Props> = ({ children }) => (
  <ol className="list-decimal space-y-1.5 pl-6 text-sm leading-relaxed marker:text-muted-foreground">{children}</ol>
);

/** 番号付きの項の 1 件 */
export const LegalItem: React.FC<Props> = ({ children }) => <li className="pl-1">{children}</li>;

/** 末尾の「以上」 */
export const LegalSignature: React.FC<Props> = ({ children }) => (
  <p className="mt-2 text-right text-sm">{children}</p>
);
