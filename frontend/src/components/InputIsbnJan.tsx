import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput, fetchAuthSession } from "aws-amplify/auth";
import { Book } from "../types/book";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import {
  Button,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import ResponsiveLayout from './ResponsiveLayout';

/**
 * ISBN手動入力画面
 * @returns コンポーネント
 */
const InputIsbnJan: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [proceedPhase, setProceedPhase] = useState(0);

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
    if (isbn) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [isbn]);

  /**
   * ISBNから書籍情報を取得する
   */
  const searchOpenBdAsync = useCallback(async (isbnjan: string): Promise<Book | undefined> => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const url = `${config.ApiEndpoint}/search-openbd`;
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      };

      const response = await axios.post(url, {
        isbnjan: isbnjan
      }, options);

      if (response.data) {
        const ret: Book = {
          username: user?.signInDetails?.loginId ?? '',
          seqno: -1,
          author: response.data.summary.author,
          isbn: response.data.summary.isbn,
          publisherName: response.data.summary.publisher,
          salesDate: response.data.summary.pubdate,
          title: response.data.summary.title,
          titleKana: response.data.onix.DescriptiveDetail.TitleDetail.TitleElement.TitleText.collationkey,
        }

        return ret;
      }
    } catch (error) {
      console.log("searchOpenBdAsync ERROR!", error);
      setIconType("error");
      setModalMessage("エラーが発生しました");
      setModalIsOpen(true);
    }
  }, [user]);

  /**
   * ISBNから書籍情報を取得する（Rakuten Books API）
   */
  const searchRakutenBookAsync = useCallback(async (isbnjan: string): Promise<Book | undefined> => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const url = `${config.ApiEndpoint}/search-rakuten-book`;
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      };

      const response = await axios.post(url, {
        isbnjan: isbnjan
      }, options);

      if (response.data) {
        const ret: Book = {
          username: user?.signInDetails?.loginId ?? '',
          seqno: -1,
          author: response.data.Item.author,
          isbn: response.data.Item.isbn,
          publisherName: response.data.Item.publisherName,
          salesDate: response.data.Item.salesDate,
          title: response.data.Item.title,
          titleKana: '',
        }

        return ret;
      }
    } catch (error) {
      console.log("searchRakutenBookAsync ERROR!", error);
      setIconType("error");
      setModalMessage("エラーが発生しました");
      setModalIsOpen(true);
    }
  }, [user]);

  /**
   * 書籍を所有しているか確認する
   */
  const checkExistsAsync = useCallback(async (isbn: string): Promise<boolean | undefined> => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const url = `${config.ApiEndpoint}/check-exists`;
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      };

      const response = await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
        isbn: isbn,
      }, options);

      if (response.data) {
        return response.data.result;
      }
    } catch (error) {
      console.log("checkExistsAsync ERROR!", error);
      setIconType("error");
      setModalMessage("エラーが発生しました");
      setModalIsOpen(true);
    }
  }, [user]);

  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setDisabled(true);
    setIsLoadingOverlay(true);

    const isExists = await checkExistsAsync(isbn);
    if (isExists) {
      setProceedPhase(1);
      setModalType("yesNo");
      setIconType("warn");
      setModalMessage("この書籍は登録済みです。\n続けますか？");
      setModalIsOpen(true);
    } else {
      const ret = await searchOpenBdAsync(isbn);
      if (ret) {
        navigate("/book", {
          state: {
            book: ret
          }
        });
      } else {
        // Rakuten Books APIでも探してみる
        const ret2 = await searchRakutenBookAsync(isbn);
        if (ret2) {
          navigate("/book", {
            state: {
              book: ret2
            }
          });
        } else {
          setProceedPhase(2);
          setModalType("yesNo");
          setIconType("warn");
          setModalMessage("書籍が見つかりませんでした。\n手動で登録しますか？");
          setModalIsOpen(true);
        }
      }
    }

    setIsLoadingOverlay(false);
  };

  /**
   * ISBNが変更されたときのイベントハンドラ
   * @param e イベント引数
   */
  const handleChangeIsbn = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsbn(e.target.value);
  };

  /**
   * モーダルを閉じるイベント
   * @param e イベント引数
   */
  const handleCloseModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetModal();
    navigate('/');
  };

  const handleYesModal = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetModal();

    // 「この書籍は登録済みです\n続けますか？」がYesの場合
    if (proceedPhase === 1) {
      const ret = await searchOpenBdAsync(isbn);
      if (ret) {
        navigate("/book", {
          state: {
            book: ret
          }
        });
      } else {
        // Rakuten Books APIでも探してみる
        const ret2 = await searchRakutenBookAsync(isbn);
        if (ret2) {
          navigate("/book", {
            state: {
              book: ret2
            }
          });
        } else {
          setProceedPhase(2);
          setModalType("yesNo");
          setIconType("warn");
          setModalMessage("書籍が見つかりませんでした。\n手動で登録しますか？");
          setModalIsOpen(true);
        }
      }

    // 「書籍が見つかりませんでした\n手動で登録しますか？」がYesの場合
    } else if (proceedPhase === 2) {
      navigate("/book", {
        state: {
          book: {
            username: user?.signInDetails?.loginId ?? '',
            seqno: -1,
            author: "",
            isbn: isbn ?? "",
            publisherName: "",
            salesDate: "",
            title: "",
            titleKana: "",
          }
        }
      });

    // それ以外の場合（想定外）
    } else {
      console.log("handleYesModal ERROR! invalid proceedPhase");
      setIconType("error");
      setModalMessage("エラーが発生しました");
      setModalIsOpen(true);
    }
  };

  /**
   * モーダルのNoイベント
   * @param e イベント引数
   */
  const handleNoModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetModal();
    navigate('/');
  };

  /**
   * モーダルを非表示（リセット）する
   */
  const resetModal = () => {
    setModalIsOpen(false);
    setModalType("none");
    setIconType("none");
    setModalMessage("");
  };

  return (
    <ResponsiveLayout>
      <Stack spacing={2} direction='column'>
        <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center' }}>
          ISBNを入力してください
        </Typography>
        <Divider />
        <TextField required id='formIsbn' label='ISBN'
          error={isbn === ''}
          value={isbn} onChange={handleChangeIsbn}
        />
        <Button fullWidth disabled={disabled || isButtonDisabled} variant='contained' onClick={handleButtonClick}>次へ</Button>
      </Stack>
      <MessageModal
        isOpen={modalIsOpen}
        iconType={iconType}
        modalType={modalType}
        message={modalMessage}
        handleClose={handleCloseModal}
        handleYes={handleYesModal}
        handleNo={handleNoModal}
      />
    </ResponsiveLayout>
  );
};

export default InputIsbnJan;
