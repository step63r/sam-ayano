import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Ellipsis,
  Home,
  Library,
  QrCode,
  ScanBarcode,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ThemeToggle from "./ThemeToggle";

/**
 * ナビゲーション項目の型
 */
type NavItem = {
  /** 表示名 */
  text: string;
  /** 下部ナビ用の短い表示名 */
  shortText: string;
  url: string;
  icon: LucideIcon;
  /** 現在のパスがこの項目に属するか */
  isActive: (pathname: string) => boolean;
};

/**
 * 常時表示するナビゲーション
 */
const mainNavItems: Array<NavItem> = [
  {
    text: "トップ",
    shortText: "トップ",
    url: "/",
    icon: Home,
    isActive: (p) => p === "/",
  },
  {
    text: "書籍を登録",
    shortText: "登録",
    url: "/readBarcode",
    icon: ScanBarcode,
    isActive: (p) => ["/readBarcode", "/inputIsbnJan", "/book", "/updateComplete"].includes(p),
  },
  {
    text: "書籍を検索",
    shortText: "一覧",
    url: "/books",
    icon: Library,
    isActive: (p) => p.startsWith("/books"),
  },
  {
    text: "会員証を提示",
    shortText: "会員証",
    url: "/membership",
    icon: QrCode,
    isActive: (p) => p === "/membership",
  },
];

/**
 * 「その他」にまとめるナビゲーション
 */
const subNavItems: Array<{ text: string; url: string; isActive: (pathname: string) => boolean }> = [
  { text: "アカウント設定", url: "/settings", isActive: (p) => p.startsWith("/settings") },
  { text: "利用規約", url: "/terms", isActive: (p) => p === "/terms" },
  { text: "プライバシーポリシー", url: "/privacyPolicy", isActive: (p) => p === "/privacyPolicy" },
];

/**
 * ヘッダーコンポーネント
 * 中幅以上は上部のメニュー、狭い画面は上部のタイトルバーと下部のタブバーで構成する
 * @returns コンポーネント
 */
const PageHeader: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  // トップページ以外で戻るボタンを表示
  const canGoBack = pathname !== "/";
  const isSubActive = subNavItems.some((item) => item.isActive(pathname));

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
        <div className="glass-strong mx-auto flex max-w-[1400px] items-center gap-1 rounded-3xl px-2 py-1.5 md:px-4">
          {/* 戻るボタン（狭い画面でのみ表示、トップページ以外） */}
          {canGoBack && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => navigate(-1)}
              aria-label="前の画面に戻る"
            >
              <ArrowLeft />
            </Button>
          )}
          <h1 className="px-2 text-lg font-bold tracking-tight">
            ツンドク.com
            <span className="ml-1.5 align-middle text-xs font-medium text-muted-foreground">β版</span>
          </h1>

          <nav aria-label="メインメニュー" className="ml-auto hidden items-center gap-1 md:flex">
            {mainNavItems.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Button
                  key={item.url}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  className={cn(active && "font-semibold")}
                >
                  <Link to={item.url} aria-current={active ? "page" : undefined}>
                    {item.text}
                  </Link>
                </Button>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isSubActive ? "secondary" : "ghost"} aria-label="その他のメニュー">
                  その他
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-52">
                {subNavItems.map((item) => (
                  <DropdownMenuItem key={item.url} onSelect={() => navigate(item.url)}>
                    {item.text}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto md:ml-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 狭い画面用の下部タブバー。安全領域（ホームバー）分の余白を確保する */}
      <nav
        aria-label="メインメニュー"
        className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <ul className="glass-strong mx-auto flex max-w-md items-stretch justify-between gap-1 rounded-full p-1.5">
          {mainNavItems.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <li key={item.url} className="flex-1">
                <Link
                  to={item.url}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active && "bg-primary/15 text-primary"
                  )}
                >
                  <Icon className="size-5" />
                  {item.shortText}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isSubActive && "bg-primary/15 text-primary"
              )}
            >
              <Ellipsis className="size-5" />
              その他
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>その他のメニュー</SheetTitle>
            <SheetDescription className="sr-only">設定や規約などのページへ移動します</SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col gap-1 px-4 pb-4">
            {subNavItems.map((item) => (
              <li key={item.url}>
                <Button
                  asChild
                  variant={item.isActive(pathname) ? "secondary" : "ghost"}
                  size="lg"
                  className="w-full justify-start"
                >
                  <Link
                    to={item.url}
                    onClick={() => setSheetOpen(false)}
                    aria-current={item.isActive(pathname) ? "page" : undefined}
                  >
                    {item.text}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PageHeader;
