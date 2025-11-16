import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { AuthUser, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import {
  BookSummary,
} from "../types/book";

import BookItem from "./BookItem";

import {
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  InputAdornment,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
} from "@mui/material";

import ResponsiveLayout from './ResponsiveLayout';

import {
  CancelRounded,
  Search,
} from "@mui/icons-material";

/** 一度にロードするデータ件数 */
const PAGE_SIZE = 10;

/** ソート設定のlocalStorageキー */
const BOOKS_SORT_SETTINGS_KEY = 'books_sort_settings';

/** 未読フィルター設定のlocalStorageキー */
const BOOKS_UNREAD_FILTER_KEY = 'books_unread_filter';

/** 検索キーワード設定のlocalStorageキー */
const BOOKS_SEARCH_KEYWORD_KEY = 'books_search_keyword';

/**
 * LastEvaluatedKey
 */
type LastEvaluatedKeyType = {
  /** ユーザー名 */
  username: string,
  /** シーケンス番号 */
  seqno: number,
};

/**
 * 書籍一覧取得APIのリクエストパラメータ
 */
type GetBooksAsyncParam = {
  /** ページサイズ */
  pageSize: number,
  /** LastEvaluatedKey */
  lastEvaluatedKey?: LastEvaluatedKeyType
  /** 検索キーワード */
  keyword: string,
  /** ソート順 */
  sortKeyId: number,
  /** 降順ソートフラグ */
  desc: boolean,
  /** 未読フラグ */
  unreadFlag?: boolean,
};

/**
 * 書籍一覧取得APIのレスポンスパラメータ
 */
type GetBooksAsyncResponse = {
  /** 書籍サマリ */
  books: BookSummary[],
  /** LastEvaluatedKey */
  lastEvaluatedKey?: LastEvaluatedKeyType,
};

/**
 * 書籍一覧画面
 * @returns コンポーネント
 */
/**
 * localStorageからソート設定を取得
 */
const getSavedSortSettings = () => {
  try {
    const saved = localStorage.getItem(BOOKS_SORT_SETTINGS_KEY);
    if (saved) {
      const { sortKeyId, isDesc } = JSON.parse(saved);
      return { sortKeyId: sortKeyId || 0, isDesc: isDesc || false };
    }
  } catch (error) {
    console.log('Failed to load sort settings:', error);
  }
  return { sortKeyId: 0, isDesc: false };
};

/**
 * ソート設定をlocalStorageに保存
 */
const saveSortSettings = (sortKeyId: number, isDesc: boolean) => {
  try {
    localStorage.setItem(BOOKS_SORT_SETTINGS_KEY, JSON.stringify({ sortKeyId, isDesc }));
  } catch (error) {
    console.log('Failed to save sort settings:', error);
  }
};

/**
 * localStorageから未読フィルター設定を取得
 */
const getSavedUnreadFilter = (): boolean => {
  try {
    const saved = localStorage.getItem(BOOKS_UNREAD_FILTER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.log('Failed to load unread filter settings:', error);
  }
  return false;
};

/**
 * 未読フィルター設定をlocalStorageに保存
 */
const saveUnreadFilter = (unreadOnly: boolean) => {
  try {
    localStorage.setItem(BOOKS_UNREAD_FILTER_KEY, JSON.stringify(unreadOnly));
  } catch (error) {
    console.log('Failed to save unread filter settings:', error);
  }
};

/**
 * localStorageから検索キーワードを取得
 */
const getSavedSearchKeyword = (): string => {
  try {
    const saved = localStorage.getItem(BOOKS_SEARCH_KEYWORD_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.log('Failed to load search keyword:', error);
  }
  return '';
};

/**
 * 検索キーワードをlocalStorageに保存
 */
const saveSearchKeyword = (keyword: string) => {
  try {
    localStorage.setItem(BOOKS_SEARCH_KEYWORD_KEY, JSON.stringify(keyword));
  } catch (error) {
    console.log('Failed to save search keyword:', error);
  }
};

const Books: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<AuthUser>();
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<LastEvaluatedKeyType>();
  const [lastEvaluatedKeySortContext, setLastEvaluatedKeySortContext] = useState<{sortKeyId: number, isDesc: boolean} | null>(null);
  const [keyword, setKeyword] = useState(getSavedSearchKeyword());
  const [debouncedKeyword] = useDebounce(keyword, 500);
  
  // 保存されたソート設定で初期化
  const savedSettings = getSavedSortSettings();
  const [sortKeyId, setSortKeyId] = useState(savedSettings.sortKeyId);
  const [isDesc, setIsDesc] = useState(savedSettings.isDesc);
  const [unreadOnly, setUnreadOnly] = useState(getSavedUnreadFilter());
  const [booksCount, setBooksCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  /**
   * 書籍情報を取得する
   */
  const getBooksAsync = useCallback(async (param: GetBooksAsyncParam): Promise<GetBooksAsyncResponse | undefined> => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      };
      const url = `${config.ApiEndpoint}/get-books`;

      const response = await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
        pageSize: param.pageSize,
        lastEvaluatedKey: param.lastEvaluatedKey,
        keyword: param.keyword,
        sortKeyId: param.sortKeyId,
        desc: param.desc,
        unreadFlag: param.unreadFlag,
      }, options);

      if (response.data) {
        return {
          books: response.data.items,
          lastEvaluatedKey: response.data.lastEvaluatedKey ?? undefined
        };
      }
    } catch (error) {
      console.log("getBooksAsync ERROR!", error);
      setModalType("none");
      setIconType("error");
      setModalMessage("エラーが発生しました");
      setModalIsOpen(true);
    }
  }, [user]);

  /**
   * 書籍件数を取得する
   */
  const getBooksCountAsync = useCallback(async (): Promise<number| undefined> => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const url = `${config.ApiEndpoint}/get-books-count`;
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      };

      const response = await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
      }, options);

      if (response.data) {
        return response.data.count;
      }
    } catch (error) {
      console.log("getBooksCountAsync ERROR!", error);
      setModalType("none");
      setIconType("error");
      setModalMessage("エラーが発生しました");
      setModalIsOpen(true);
    }
  }, [user]);

  /**
   * useEffect
   */
  useEffect(() => {
    console.log("useEffect[] start");

    (async () => {
      const ret = await getCurrentUser();
      if (ret) {
        setUser(ret);
      }
    })();
    
    console.log("useEffect[] end");
  }, []);

  /**
   * useEffect
   */
  useEffect(() => {
    console.log("useEffect[user, debouncedKeyword, getBooksAsync, isDesc, sortKeyId, setIsLoadingOverlay] start");

    (async () => {
      setIsLoadingOverlay(true);

      if (user) {
        setBooks([]);
        const result = await getBooksAsync({
          pageSize: PAGE_SIZE,
          lastEvaluatedKey: undefined,
          keyword: debouncedKeyword,
          sortKeyId: sortKeyId,
          desc: isDesc,
          unreadFlag: unreadOnly,
        });

        console.log("getBooksAsync result", result);

        if (result) {
          setBooks([...result.books]);
          if (result.lastEvaluatedKey) {
            setLastEvaluatedKey(result.lastEvaluatedKey);
            // 初期データ取得時のソートコンテキストを保存
            setLastEvaluatedKeySortContext({ sortKeyId, isDesc });
          } else {
            setLastEvaluatedKey(undefined);
            setLastEvaluatedKeySortContext(null);
          }
        }
      }

      setIsLoadingOverlay(false);
    })();

    console.log("useEffect[user, debouncedKeyword, getBooksAsync, isDesc, sortKeyId, setIsLoadingOverlay] end");
  }, [user, debouncedKeyword, getBooksAsync, isDesc, sortKeyId, unreadOnly, setIsLoadingOverlay]);

  /**
   * useEffect
   */
  useEffect(() => {
    console.log("useEffect[user, getBooksCountAsync] start");

    (async () => {
      if (user) {
        const result = await getBooksCountAsync();

        console.log("getBooksCountAsync result", result);

        if (result) {
          setBooksCount(result);
        }
      }
    })();

    console.log("useEffect[user, getBooksCountAsync] end");
  }, [user, getBooksCountAsync]);

  /**
   * 追加データ読み込み処理
   */
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !lastEvaluatedKey) return;
    
    // ソート設定の整合性をチェック
    if (lastEvaluatedKeySortContext && 
        (lastEvaluatedKeySortContext.sortKeyId !== sortKeyId || 
         lastEvaluatedKeySortContext.isDesc !== isDesc)) {
      console.log("Sort setting changed, resetting lastEvaluatedKey");
      setLastEvaluatedKey(undefined);
      setLastEvaluatedKeySortContext(null);
      return;
    }
    
    console.log("handleLoadMore start with consistent sort settings");
    setIsLoadingMore(true);

    const result = await getBooksAsync({
      pageSize: PAGE_SIZE,
      lastEvaluatedKey: lastEvaluatedKey,
      keyword: keyword,
      sortKeyId: sortKeyId,
      desc: isDesc,
      unreadFlag: unreadOnly,
    });

    if (result) {
      setBooks(prevBooks => {
        const existingSeqnos = new Set(prevBooks.map(book => book.seqno));
        const newBooks = result.books.filter(book => !existingSeqnos.has(book.seqno));
        return [...prevBooks, ...newBooks];
      });
      if (result.lastEvaluatedKey) {
        setLastEvaluatedKey(result.lastEvaluatedKey);
        // lastEvaluatedKeyと一緒にソートコンテキストを保存
        setLastEvaluatedKeySortContext({ sortKeyId, isDesc });
      } else {
        setLastEvaluatedKey(undefined);
        setLastEvaluatedKeySortContext(null);
      }
    }

    setIsLoadingMore(false);
    console.log("handleLoadMore end");
  }, [getBooksAsync, isDesc, keyword, lastEvaluatedKey, sortKeyId, isLoadingMore, lastEvaluatedKeySortContext, unreadOnly]);

  /**
   * 無限スクロール用のIntersectionObserver設定
   */
  useEffect(() => {
    console.log("useEffect[handleLoadMore] start - IntersectionObserver");
    
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && lastEvaluatedKey && !isLoadingMore) {
          console.log("Sentinel intersecting - loading more data");
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // 100px手前で読み込み開始
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    console.log("useEffect[handleLoadMore] end - IntersectionObserver");
    return () => {
      observer.unobserve(sentinel);
    };
  }, [handleLoadMore, lastEvaluatedKey, isLoadingMore]);

  /**
   * ソート順変更イベント
   */
  const handleChangeSortKey = useCallback(async (e: SelectChangeEvent) => {
    console.log("handleChangeSortKey start");
    setIsLoadingOverlay(true);

    if (user) {
      const val = parseInt(e.target.value);

      const newSortKeyId = Math.floor(val / 10);
      const newIsDesc = val % 10 === 1 ? true : false;
      
      // ソート設定を更新してlocalStorageに保存
      setSortKeyId(newSortKeyId);
      setIsDesc(newIsDesc);
      saveSortSettings(newSortKeyId, newIsDesc);

      // ソート変更時にlastEvaluatedKeyをリセット
      setLastEvaluatedKey(undefined);
      setLastEvaluatedKeySortContext(null);
      setBooks([]);

      const result = await getBooksAsync({
        pageSize: PAGE_SIZE,
        lastEvaluatedKey: undefined,
        keyword: debouncedKeyword,
        sortKeyId: newSortKeyId,
        desc: newIsDesc,
        unreadFlag: unreadOnly,
      });

      console.log("getBooksAsync result", result);

      if (result) {
        setBooks([...result.books]);
        if (result.lastEvaluatedKey) {
          setLastEvaluatedKey(result.lastEvaluatedKey);
          // 新しいソート設定でのlastEvaluatedKeyコンテキストを保存
          setLastEvaluatedKeySortContext({ sortKeyId: newSortKeyId, isDesc: newIsDesc });
        } else {
          setLastEvaluatedKey(undefined);
          setLastEvaluatedKeySortContext(null);
        }
      }
    }

    setIsLoadingOverlay(false);
    console.log("handleChangeSortKey end");
  }, [debouncedKeyword, getBooksAsync, user, setIsLoadingOverlay, unreadOnly]);

  /**
   * モーダルを閉じるイベント
   * @param e イベント引数
   */
  const handleCloseModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setModalIsOpen(false);
    setModalType("none");
    setIconType("none");
    setModalMessage("");
    navigate('/');
  };

  return (
    <ResponsiveLayout>
      <Stack spacing={2} direction='column'>
        <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center' }}>
          あなたの書籍情報
        </Typography>
        <Divider />
        <TextField
          placeholder="検索"
          type="text"
          variant="outlined"
          fullWidth
          size="small"
          value={keyword}
          onChange={(e) => {
            const newValue = e.target.value;
            setKeyword(newValue);
            saveSearchKeyword(newValue);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <IconButton onClick={() => {
                  setKeyword("");
                  saveSearchKeyword("");
                }}>
                  <CancelRounded />
                </IconButton>
              )
            }
          }}
        />
        <FormControl fullWidth>
          <InputLabel>並び替え</InputLabel>
          <Select
            label="並び替え"
            value={(sortKeyId * 10 + (isDesc ? 1 : 0)).toString()}
            onChange={handleChangeSortKey}
          >
            <MenuItem value={0}>登録順（古い順）</MenuItem>
            <MenuItem value={1}>登録順（新しい順）</MenuItem>
            <MenuItem value={20}>タイトル順（昇順）</MenuItem>
            <MenuItem value={21}>タイトル順（降順）</MenuItem>
            <MenuItem value={30}>発売日順（古い順）</MenuItem>
            <MenuItem value={31}>発売日順（新しい順）</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              checked={unreadOnly}
              onChange={(e) => {
                const newValue = e.target.checked;
                setUnreadOnly(newValue);
                saveUnreadFilter(newValue);
              }}
              color="primary"
            />
          }
          label="未読のみ表示"
          sx={{ width: 'fit-content' }}
        />
        <Typography variant='caption' component='div'>
          合計 {booksCount.toLocaleString()} 冊の書籍
        </Typography>
        <Stack spacing={2} direction='column'>
          {books?.map((book, index) => (
            <BookItem key={`${book.seqno}-${index}`} book={book} onClick={() => navigate(`/books/${book.seqno}`)} />
          ))}
        </Stack>
        {books.length === 0 && (
          <Typography variant='caption' component='div' sx={{ textAlign: 'center' }}>
            検索結果がありません
          </Typography>
        )}
        {/* 無限スクロール用のセンチネル要素 */}
        {lastEvaluatedKey && (
          <div ref={sentinelRef} style={{ height: '1px' }} />
        )}
        {/* データ読み込み中の表示 */}
        {isLoadingMore && (
          <Typography variant='caption' component='div' sx={{ textAlign: 'center', padding: 2 }}>
            読み込み中...
          </Typography>
        )}
      </Stack>
      <MessageModal
        isOpen={modalIsOpen}
        iconType={iconType}
        modalType={modalType}
        message={modalMessage}
        handleClose={handleCloseModal}
      />
    </ResponsiveLayout>
  );
}

export default Books;
