import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { AuthUser, getCurrentUser } from "aws-amplify/auth";
import axios from "axios";

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
} from "@mui/material";

import {
  CancelRounded,
  Search,
} from "@mui/icons-material";

const PAGE_SIZE = 10;

type LastEvaluatedKeyType = {
  username: string,
  seqno: number,
};

type GetBooksAsyncParam = {
  pageSize: number,
  lastEvaluatedKey: LastEvaluatedKeyType | undefined,
  keyword: string,
};

type GetBooksAsyncResponse = {
  books: BookSummary[],
  lastEvaluatedKey: LastEvaluatedKeyType | undefined
};

const Books: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<AuthUser>();
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<LastEvaluatedKeyType>();
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword] = useDebounce(keyword, 500);

  const getBooksAsync = useCallback(async (param: GetBooksAsyncParam): Promise<GetBooksAsyncResponse | undefined> => {
    try {
      const url = `${config.ApiEndpoint}/get-books`;
      const response = await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
        pageSize: param.pageSize,
        lastEvaluatedKey: param.lastEvaluatedKey,
        keyword: param.keyword
      });

      if (response.data) {
        return {
          books: response.data.items,
          lastEvaluatedKey: response.data.lastEvaluatedKey ?? undefined
        };
      }
    } catch (error) {
      console.log("getBooksAsync ERROR!", error);
    }
  }, [user?.signInDetails?.loginId]);

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

  useEffect(() => {
    console.log("useEffect[user, debouncedKeyword, getBooksAsync] start");

    (async () => {
      if (user) {
        setBooks([]);
        const result = await getBooksAsync({
          pageSize: PAGE_SIZE,
          lastEvaluatedKey: undefined,
          keyword: debouncedKeyword
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
    })();

    console.log("useEffect[user, debouncedKeyword, getBooksAsync] end");
  }, [user, debouncedKeyword, getBooksAsync]);

  const handleLoadMore = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    console.log("handleLoadMore start");

    const result = await getBooksAsync({
      pageSize: PAGE_SIZE,
      lastEvaluatedKey: lastEvaluatedKey,
      keyword: keyword
    });

    if (result) {
      setBooks([...books, ...result.books]);
      if (result.lastEvaluatedKey) {
        setLastEvaluatedKey(result.lastEvaluatedKey);
      } else {
        setLastEvaluatedKey(undefined);
      }
    }

    console.log("handleLoadMore end");
  };

  return (
    <Grid marginX={2}>
      <Stack spacing={2} direction='column'>
        <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center', paddingTop: 2 }}>
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
        <Stack spacing={2} direction='column'>
          {books?.map((book) => (
            <BookItem key={book.seqno} book={book} />
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
    </Grid>
  );
}

export default Books;
