import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import axios from "axios";
import {
  ArrowRightLeft,
  BookOpen,
  IdCard,
  Library,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";

import config from "../config.json";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ResponsiveLayout from './ResponsiveLayout';

/**
 * ホームのアクションタイルのプロパティ
 */
type ActionTileProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** 主要な操作として強調表示する */
  primary?: boolean;
  className?: string;
};

/**
 * ホームのアクションタイル
 */
const ActionTile: React.FC<ActionTileProps> = ({
  icon: Icon,
  title,
  description,
  disabled,
  onClick,
  primary = false,
  className,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "group flex w-full items-center gap-4 rounded-3xl p-5 text-left transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:opacity-60",
      primary
        ? "bg-linear-to-br from-primary/90 to-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.35),0_12px_28px_-12px_var(--primary)]"
        : "glass",
      className
    )}
  >
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-2xl",
        primary ? "bg-white/20" : "bg-primary/15 text-primary"
      )}
    >
      <Icon className="size-6" aria-hidden />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-lg leading-tight font-semibold">{title}</span>
      <span className={cn("mt-1 block text-sm", primary ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {description}
      </span>
    </span>
  </button>
);

/**
 * ホーム画面
 * @returns コンポーネント
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const [disabled, setDisabled] = useState(false);
  /** 登録冊数。取得前は undefined、取得失敗時は null */
  const [booksCount, setBooksCount] = useState<number | null | undefined>(undefined);

  /**
   * 登録冊数の取得
   * 装飾的な情報なので、失敗してもエラーダイアログは出さず冊数の表示だけ隠す
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        const response = await axios.post(`${config.ApiEndpoint}/get-books-count`, {}, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
        });
        if (!cancelled) {
          setBooksCount(typeof response.data?.count === 'number' ? response.data.count : null);
        }
      } catch (error) {
        console.log("Home get-books-count ERROR!", error);
        if (!cancelled) {
          setBooksCount(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * タイルのクリックイベントを作る
   * 二度押しを防ぐため、押下後は全タイルを無効化してから遷移する
   * @param url 遷移先
   */
  const handleNavigate = (url: string) => (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate(url);
  };

  return (
    <ResponsiveLayout>
      <div className="flex flex-col gap-4">
        {booksCount !== null && (
          <section aria-label="登録冊数" className="glass flex items-center gap-4 rounded-3xl p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <BookOpen className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">登録済みの書籍</p>
              {booksCount === undefined ? (
                <Skeleton className="mt-1 h-8 w-24" />
              ) : (
                <p className="text-3xl leading-none font-bold tracking-tight">
                  {booksCount.toLocaleString()}
                  <span className="ml-1 text-base font-medium text-muted-foreground">冊</span>
                </p>
              )}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ActionTile
            primary
            icon={Plus}
            title="書籍を登録する"
            description="バーコードまたはISBNから追加"
            disabled={disabled}
            onClick={handleNavigate('/readBarcode')}
          />
          <ActionTile
            icon={Library}
            title="登録済み書籍を見る"
            description="検索・並び替え・編集"
            disabled={disabled}
            onClick={handleNavigate('/books')}
          />
          <ActionTile
            icon={IdCard}
            title="会員証を提示"
            description="貸出時に相手へ見せるQRコード"
            disabled={disabled}
            onClick={handleNavigate('/membership')}
          />
          <ActionTile
            icon={ArrowRightLeft}
            title="貸出処理"
            description="会員証を読み取って本を貸し出す"
            disabled={disabled}
            onClick={handleNavigate('/lend/readQR')}
          />
          <ActionTile
            icon={Settings}
            title="アカウント設定"
            description="パスワード変更・ログアウト"
            disabled={disabled}
            onClick={handleNavigate('/settings')}
            className="lg:col-span-2"
          />
        </div>
      </div>
    </ResponsiveLayout>
  );
}

export default Home;
