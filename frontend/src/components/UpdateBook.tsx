import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput } from "aws-amplify/auth";
import { Book, initBook } from "../types/book";
import axios from "axios";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import {
  Button,
  Divider,
  Grid2 as Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const UpdateBook: React.FC = () => {
  const urlParams = useParams<{ seqno: string }>();
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [book, setBook] = useState<Book>(initBook);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const getBookAsync = useCallback(async (seqno: number): Promise<Book | undefined> => {
    try {
      const url = `${config.ApiEndpoint}/get-book`;
      const response = await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
        seqno: seqno
      });

      return response.data.items;

    } catch (error) {
      console.log("getBookAsync ERROR!", error);
    }
  }, [user?.signInDetails?.loginId]);

  const updateBooksAsync = useCallback(async (item: Book): Promise<boolean> => {
    try {
      const url = `${config.ApiEndpoint}/update-books`;
      await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
        data: {
          seqno: item.seqno,
          author: book.author,
          isbn: book.isbn,
          publisherName: book.publisherName,
          salesDate: book.salesDate,
          title: book.title,
          titleKana: book.titleKana,
        }
      });

      return true;

    } catch (error) {
      console.log("updateBooksAsync ERROR!", error);
      return false;
    }
  }, [book, user]);

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
    console.log("useEffect[user, getBookAsync, urlParams] start");

    (async () => {
      if (user && urlParams.seqno) {
        const ret = await getBookAsync(Number(urlParams.seqno));
        if (ret) {
          setBook(ret);
        }
      }
    })();

    console.log("useEffect[user] end");
  }, [user, getBookAsync, urlParams]);

  useEffect(() => {
    if (book?.title) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [book]);

  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, title: e.target.value });
  };
  
  const handleChangeTitleKana = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, titleKana: e.target.value });
  };
  
  const handleChangeAuthor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, author: e.target.value });
  };
  
  const handleChangePublisherName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, publisherName: e.target.value });
  };
  
  const handleChangeSalesDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, salesDate: e.target.value });
  };
  
  const handleChangeIsbn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, isbn: e.target.value });
  };
  
  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setIsLoadingOverlay(true);
  
    await updateBooksAsync(book);
  
    setIsLoadingOverlay(false);
    navigate('/updateComplete');
  };

  return (
    <Grid marginX={2}>
      <Stack spacing={2} direction='column'>
        <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center', paddingTop: 2 }}>
          書籍詳細
        </Typography>
        <Divider />
        <TextField required id='formTitle' label='タイトル'
          error={book.title === ''}
          value={book.title} onChange={handleChangeTitle}
        />
        <TextField id='formTitleKana' label='タイトル（カナ）'
          value={book.titleKana} onChange={handleChangeTitleKana}
        />
        <TextField id='formAuthor' label='著者'
          value={book.author} onChange={handleChangeAuthor}
        />
        <TextField id='formPublisherName' label='出版社'
          value={book.publisherName} onChange={handleChangePublisherName}
        />
        <TextField id='formSalesData' label='発売日'
          value={book.salesDate} onChange={handleChangeSalesDate}
        />
        <TextField id='formIsbn' label='ISBN'
          disabled={true}
          value={book.isbn} onChange={handleChangeIsbn}
        />
        <Button fullWidth variant='contained' disabled={isButtonDisabled} onClick={handleButtonClick}>登録する</Button>
        <Button fullWidth variant='outlined' onClick={() => navigate('/books')}>一覧に戻る</Button>
      </Stack>
    </Grid>
  );
};

export default UpdateBook;