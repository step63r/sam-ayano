import React from "react";

type PageTitleProps = {
  title: string;
  description?: string;
};

/**
 * 画面タイトル
 * ヘッダーの h1（サイト名）の下に位置するため h2 にしている
 */
const PageTitle: React.FC<PageTitleProps> = ({ title, description }) => (
  <div className="mb-4 space-y-1 text-center">
    <h2 className="text-xl font-bold tracking-tight">{title}</h2>
    {description && <p className="text-sm text-muted-foreground">{description}</p>}
  </div>
);

export default PageTitle;
