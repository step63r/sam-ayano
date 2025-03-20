import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { AuthUser, getCurrentUser } from "aws-amplify/auth";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import {
  BookSummary,
} from "../types/book";

import BookItem from "./BookItem";

import {
  Button,
  Divider,
  Grid2 as Grid,
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

import {
  CancelRounded,
  Search,
} from "@mui/icons-material";

/** 一度にロードするデータ件数 */
const PAGE_SIZE = 10;

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
const Books: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<AuthUser>();
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<LastEvaluatedKeyType>();
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword] = useDebounce(keyword, 500);
  const [sortKeyId, setSortKeyId] = useState(0);
  const [isDesc, setIsDesc] = useState(false);
  const [booksCount, setBooksCount] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");

  /**
   * 書籍情報を取得する
   */
  const getBooksAsync = useCallback(async (param: GetBooksAsyncParam): Promise<GetBooksAsyncResponse | undefined> => {
    try {
      const url = `${config.ApiEndpoint}/get-books`;
      const response = await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
        pageSize: param.pageSize,
        lastEvaluatedKey: param.lastEvaluatedKey,
        keyword: param.keyword,
        sortKeyId: param.sortKeyId,
        desc: param.desc,
      });

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
      const url = `${config.ApiEndpoint}/get-books-count`;
      const response = await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
      });

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
        });

        console.log("getBooksAsync result", result);

        if (result) {
          setBooks([...result.books]);
          if (result.lastEvaluatedKey) {
            setLastEvaluatedKey(result.lastEvaluatedKey);
          } else {
            setLastEvaluatedKey(undefined);
          }
        }
      }

      setIsLoadingOverlay(false);
    })();

    console.log("useEffect[user, debouncedKeyword, getBooksAsync, isDesc, sortKeyId, setIsLoadingOverlay] end");
  }, [user, debouncedKeyword, getBooksAsync, isDesc, sortKeyId, setIsLoadingOverlay]);

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
   * 「もっと見る」ボタン押下イベント
   */
  const handleLoadMore = useCallback(async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    console.log("handleLoadMore start");
    setIsLoadingOverlay(true);

    const result = await getBooksAsync({
      pageSize: PAGE_SIZE,
      lastEvaluatedKey: lastEvaluatedKey,
      keyword: keyword,
      sortKeyId: sortKeyId,
      desc: isDesc,
    });

    if (result) {
      setBooks([...books, ...result.books]);
      if (result.lastEvaluatedKey) {
        setLastEvaluatedKey(result.lastEvaluatedKey);
      } else {
        setLastEvaluatedKey(undefined);
      }
    }

    setIsLoadingOverlay(false);
    console.log("handleLoadMore end");
  }, [books, getBooksAsync, isDesc, keyword, lastEvaluatedKey, sortKeyId, setIsLoadingOverlay]);

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
      setSortKeyId(newSortKeyId);
      setIsDesc(newIsDesc);

      setBooks([]);

      const result = await getBooksAsync({
        pageSize: PAGE_SIZE,
        lastEvaluatedKey: undefined,
        keyword: debouncedKeyword,
        sortKeyId: newSortKeyId,
        desc: newIsDesc,
      });

      console.log("getBooksAsync result", result);

      if (result) {
        setBooks([...result.books]);
        if (result.lastEvaluatedKey) {
          setLastEvaluatedKey(result.lastEvaluatedKey);
        } else {
          setLastEvaluatedKey(undefined);
        }
      }
    }

    setIsLoadingOverlay(false);
    console.log("handleChangeSortKey end");
  }, [debouncedKeyword, getBooksAsync, user, setIsLoadingOverlay]);

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
    <Grid margin={2} paddingBottom={2}>
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
          onChange={(e) => setKeyword(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <IconButton onClick={() => setKeyword("")}>
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
            defaultValue="0"
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
        <Typography variant='caption' component='div'>
          合計 {booksCount.toLocaleString()} 冊の書籍
        </Typography>
        <Stack spacing={2} direction='column'>
          {books?.map((book) => (
            <BookItem key={book.seqno} book={book} onClick={() => navigate(`/books/${book.seqno}`)} />
          ))}
        </Stack>
        {lastEvaluatedKey && (
          <Button fullWidth variant='contained' onClick={handleLoadMore}>もっと見る</Button>
        )}
        {books.length === 0 && (
          <Typography variant='caption' component='div' sx={{ textAlign: 'center' }}>
            検索結果がありません
          </Typography>
        )}
        <Button fullWidth variant='outlined' onClick={() => navigate('/')}>ホームに戻る</Button>
      </Stack>
      <MessageModal
        isOpen={modalIsOpen}
        iconType={iconType}
        modalType={modalType}
        message={modalMessage}
        handleClose={handleCloseModal}
      />
    </Grid>
  );
}

export default Books;
