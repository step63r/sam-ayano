import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput, fetchAuthSession } from "aws-amplify/auth";
import { Book, initBook } from "../types/book";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import { Button } from "@/components/ui/button";

import ResponsiveLayout from './ResponsiveLayout';
import PageTitle from "./PageTitle";
import FormField from "./FormField";
import BookCover from "./BookCover";

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
        data: {
          author: book.author,
          isbn: book.isbn,
          publisherName: book.publisherName,
          salesDate: book.salesDate,
          title: book.title,
          titleKana: book.titleKana,
          coverUrl: book.coverUrl,
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
    <ResponsiveLayout>
      <div className="mx-auto w-full max-w-2xl">
        <PageTitle title="書籍の情報を確認・修正してください" />
        <div className="glass flex flex-col gap-5 rounded-3xl p-5 md:p-8">
          {/* 書影は検索で見つかった場合だけ表示する（手入力の登録では出さない） */}
          {book.coverUrl && (
            <div className="flex justify-center">
              <BookCover title={book.title} coverUrl={book.coverUrl} className="w-28 sm:w-32" />
            </div>
          )}
          <FormField required id='formTitle' label='タイトル'
            error={book.title === ''}
            value={book.title} onChange={handleChangeTitle}
          />
          <FormField required id='formTitleKana' label='タイトル（カナ）'
            error={book.titleKana === ''}
            value={book.titleKana} onChange={handleChangeTitleKana}
          />
          <FormField id='formAuthor' label='著者'
            value={book.author} onChange={handleChangeAuthor}
          />
          <FormField id='formPublisherName' label='出版社'
            value={book.publisherName} onChange={handleChangePublisherName}
          />
          <FormField required id='formSalesData' label='発売日'
            error={book.salesDate === ''}
            value={book.salesDate} onChange={handleChangeSalesDate}
          />
          <FormField id='formIsbn' label='ISBN'
            value={book.isbn} onChange={handleChangeIsbn}
          />
          <Button size="lg" className="w-full" disabled={disabled || isButtonDisabled} onClick={handleButtonClick}>登録する</Button>
        </div>
      </div>
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

export default BookDetail;
