import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, GetCurrentUserOutput } from "aws-amplify/auth";
import { Book, initBook } from "../types/book";
import axios from "axios";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import {
  Button,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const BookDetail: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const location = useLocation();
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [isbnjan, setIsbnjan] = useState<string>('');
  const [book, setBook] = useState<Book>(initBook);

  const getCurrentUserAsync = async () => {
    const result = await getCurrentUser();
    console.log(result);
    setUser(result);
  };

  const loadBookInfoAsync = async () => {
    const isbnjan = location.state?.isbnjan as string;
    if (isbnjan) {
      setIsbnjan(isbnjan);
      searchOpenBd(isbnjan);
    }

    const book = location.state?.book as Book;
    if (book) {
      setBook(book);
    }

    setIsLoadingOverlay(false);
  };

  useEffect(() => {
    getCurrentUserAsync();
    loadBookInfoAsync();
  }, []);

  const searchOpenBd = async (isbnjan: string) => {
    const url = `${config.ApiEndpoint}/search-openbd`;
    await axios.post(url, { isbnjan: isbnjan })
      .then(response => {
        const item = response.data;

        const result: Book = {
          username: user?.signInDetails?.loginId ?? '',
          seqno: -1,
          author: item.summary.author,
          isbn: item.summary.isbn,
          publisherName: item.summary.publisher,
          salesDate: item.summary.pubdate,
          title: item.summary.title,
        }

        setBook(result);
      })
      .catch(error => {
        console.log(error);
      });
  }

  const updateBooks = async () => {
    const url = `${config.ApiEndpoint}/update-books`;
    await axios.post(url, {
      userName: user?.signInDetails?.loginId,
      data: {
        author: book.author,
        isbn: book.isbn,
        publisherName: book.publisherName,
        salesDate: book.salesDate,
        title: book.title
      }
    })
      .then(response => {
        console.log(response);
      })
      .catch(error => {
        console.log(error);
    })
  };

  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, title: e.target.value });
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

    await updateBooks();

    setIsLoadingOverlay(false);
    navigate('/updateComplete');
  };

  return (
    <Authenticator>
      <Stack spacing={2} direction='column' margin={4}>
      <Typography variant='h3' component='div' gutterBottom>
        書籍を登録
      </Typography>
        <TextField required id='formTitle' label='タイトル'
          error={book.title === ''}
          value={book.title} onChange={handleChangeTitle}
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
        <TextField required id='formIsbn' label='ISBN'
          error={book.isbn === ''}
          value={book.isbn} onChange={handleChangeIsbn}
          slotProps={{
            input: {
              readOnly: true,
            }
          }}
        />
        <Button fullWidth variant='contained' onClick={handleButtonClick}>登録する</Button>
        <Button fullWidth variant='outlined' onClick={() => navigate('/')}>ホームに戻る</Button>
      </Stack>
    </Authenticator>
  );
}

export default BookDetail;
