import React from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

/**
 * レスポンシブレイアウトコンポーネント
 * 一定以上の画面幅でマージンを設ける共通レイアウト
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  return (
    <div className="mx-auto w-full max-w-full px-4 py-4 sm:px-6 md:px-8 lg:max-w-[1200px] lg:px-16 xl:max-w-[1400px] xl:px-24">
      {children}
    </div>
  );
};

export default ResponsiveLayout;
