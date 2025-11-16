import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput, fetchAuthSession } from "aws-amplify/auth";
import { Book, initBook } from "../types/book";
import axios from "axios";
import MessageModal from "./MessageModal";

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

import * as AutoKana from "vanilla-autokana";

/**
 * 登録情報編集画面
 * @returns コンポーネント
 */
const BookDetail: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const location = useLocation();
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [book, setBook] = useState<Book>(initBook);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");
  const [disabled, setDisabled] = useState(false);
  const autoKana = useRef<AutoKana.AutoKana>(null);

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

    // AutoKanaのバインド
    autoKana.current = AutoKana.bind("#formTitle", "#formTitleKana", { katakana: true });

    console.log("useEffect[] end");
  }, []);

  /**
   * useEffect
   */
  useEffect(() => {
    if (location.state?.book) {
      setBook(location.state?.book);
    }
  }, [location]);

  /**
   * useEffect
   */
  useEffect(() => {
    if (book?.title && book?.titleKana && book?.salesDate) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [book]);

  /**
   * 書籍情報を登録する
   */
  const updateBooksAsync = useCallback(async (book: Book): Promise<boolean> => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const url = `${config.ApiEndpoint}/update-books`;
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      };

      await axios.post(url, {
        userName: user?.signInDetails?.loginId,
        data: {
          author: book.author,
          isbn: book.isbn,
          publisherName: book.publisherName,
          salesDate: book.salesDate,
          title: book.title,
          titleKana: book.titleKana,
        }
      }, options);

      return true;
    } catch (error) {
      console.log("updateBooksAsync ERROR!", error);
      setModalType("none");
      setIconType("error");
      setModalMessage("エラーが発生しました");
      setModalIsOpen(true);
      return false;
    }
  }, [user]);

  /**
   * タイトルが変更されたときのイベントハンドラ
   * @param e イベント引数
   */
  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    // AutoKanaの実行
    if (autoKana.current) {
      setBook({ ...book, title: e.target.value, titleKana: autoKana.current.getFurigana() });
    }
    else {
      setBook({ ...book, title: e.target.value });
    }
  };

  /**
   * タイトル（カナ）が変更されたときのイベントハンドラ
   * @param e イベント引数
   */
  const handleChangeTitleKana = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, titleKana: e.target.value });
  };

  /**
   * 著者が変更されたときのイベントハンドラ
   * @param e イベント引数
   */
  const handleChangeAuthor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, author: e.target.value });
  };

  /**
   * 出版社が変更されたときのイベントハンドラ
   * @param e イベント引数
   */
  const handleChangePublisherName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, publisherName: e.target.value });
  };

  /**
   * 発売日が変更されたときのイベントハンドラ
   * @param e イベント引数
   */
  const handleChangeSalesDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, salesDate: e.target.value });
  };

  /**
   * ISBNが変更されたときのイベントハンドラ
   * @param e イベント引数
   */
  const handleChangeIsbn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({ ...book, isbn: e.target.value });
  };

  /**
   * 「登録する」ボタン押下イベント
   * @param e イベント引数
   */
  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setDisabled(true);
    setIsLoadingOverlay(true);

    const ret = await updateBooksAsync(book);

    setIsLoadingOverlay(false);

    if (ret) {
      navigate('/updateComplete', { replace: true });
    }
  };

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
          書籍の情報を確認・修正してください
        </Typography>
        <Divider />
        <TextField required id='formTitle' label='タイトル'
          error={book.title === ''}
          value={book.title} onChange={handleChangeTitle}
        />
        <TextField required id='formTitleKana' label='タイトル（カナ）'
          error={book.titleKana === ''}
          value={book.titleKana} onChange={handleChangeTitleKana}
        />
        <TextField id='formAuthor' label='著者'
          value={book.author} onChange={handleChangeAuthor}
        />
        <TextField id='formPublisherName' label='出版社'
          value={book.publisherName} onChange={handleChangePublisherName}
        />
        <TextField required id='formSalesData' label='発売日'
          error={book.salesDate === ''}
          value={book.salesDate} onChange={handleChangeSalesDate}
        />
        <TextField id='formIsbn' label='ISBN'
          value={book.isbn} onChange={handleChangeIsbn}
        />
        <Button fullWidth disabled={disabled || isButtonDisabled} variant='contained' onClick={handleButtonClick}>登録する</Button>
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

export default BookDetail;
