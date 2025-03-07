import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput } from "aws-amplify/auth";
import axios from "axios";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import {
  BookSummary,
  GetBooksResponse,
} from "../types/book";

import BookItem from "./BookItem";

import {
  Button,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography
} from "@mui/material";

const PAGE_SIZE = 10;

type LastEvaluatedKeyType = {
  username: string,
  seqno: number,
};

const Books: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<LastEvaluatedKeyType>();

  const getCurrentUserAsync = async () => {
    const result = await getCurrentUser();
    console.log(result);
    setUser(result);
  };

  const getBooksAsync = async (pageSize: number, lastEvaluatedKey: LastEvaluatedKeyType | undefined = undefined) => {
    const url = `${config.ApiEndpoint}/get-books`;
    await axios.post(url, {
      userName: user?.signInDetails?.loginId ?? '',
      pageSize: pageSize,
      lastEvaluatedKey: lastEvaluatedKey
    })
      .then(response => {
        const res: GetBooksResponse = response.data;
        setBooks([...books, ...res.items]);
        if (res.lastEvaluatedKey) {
          setLastEvaluatedKey(res.lastEvaluatedKey);
        } else {
          setLastEvaluatedKey(undefined);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  useEffect(() => {
    getCurrentUserAsync();
  }, [])

  useEffect(() => {
    if (user) {
      getBooksAsync(PAGE_SIZE);
    }
  }, [user]);

  const handleGetBooksAsync = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setIsLoadingOverlay(true);

    await getBooksAsync(PAGE_SIZE, lastEvaluatedKey);

    setIsLoadingOverlay(false);
  };

  return (
    <Grid marginX={2}>
      <Stack spacing={2} direction='column'>
        <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center', paddingTop: 2 }}>
          あなたの書籍情報
        </Typography>
        <Divider />
        <Stack spacing={2} direction='column'>
          {books?.map((book) => (
            <BookItem key={book.seqno} book={book} />
          ))}
        </Stack>
        {lastEvaluatedKey && (
          <Button fullWidth variant='contained' onClick={handleGetBooksAsync}>もっと見る</Button>
        )}
        <Button fullWidth variant='outlined' onClick={() => navigate('/')}>ホームに戻る</Button>
      </Stack>
    </Grid>
  );
}

export default Books;
