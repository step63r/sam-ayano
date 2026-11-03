import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCurrentUser,
  GetCurrentUserOutput,
  fetchAuthSession,
} from "aws-amplify/auth";
import { Book, initBook } from "../types/book";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import ResponsiveLayout from "./ResponsiveLayout";
import PageTitle from "./PageTitle";
import FormField from "./FormField";
import BookCover from "./BookCover";

import * as AutoKana from "vanilla-autokana";

/**
 * 登録情報更新画面
 * @returns コンポーネント
 */
const UpdateBook: React.FC = () => {
  const { seqno } = useParams();
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [book, setBook] = useState<Book>(initBook);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">(
    "none"
  );
  const [modalMessage, setModalMessage] = useState("");
  const autoKana = useRef<AutoKana.AutoKana>(null);
  const [proceedPhase, setProceedPhase] = useState(0);

  /**
   * 書籍情報を取得する
   */
  const getBookAsync = useCallback(
    async (seqno: number): Promise<Book | undefined> => {
      try {
        const session = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        const url = `${config.ApiEndpoint}/get-book`;
        const options = {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        };

        const response = await axios.post(
          url,
          {
            userName: user?.signInDetails?.loginId ?? "",
            seqno: seqno,
          },
          options
        );

        return response.data.items;
      } catch (error) {
        console.log("getBookAsync ERROR!", error);
        setModalType("none");
        setIconType("error");
        setModalMessage("エラーが発生しました");
        setModalIsOpen(true);
      }
    },
    [user]
  );

  /**
   * 書籍情報を更新する
   */
  const updateBooksAsync = useCallback(
    async (item: Book): Promise<boolean> => {
      try {
        const session = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        const url = `${config.ApiEndpoint}/update-books`;
        const options = {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        };

        await axios.post(
          url,
          {
            userName: user?.signInDetails?.loginId ?? "",
            data: {
              seqno: item.seqno,
              author: book.author,
              isbn: book.isbn,
              publisherName: book.publisherName,
              salesDate: book.salesDate,
              title: book.title,
              titleKana: book.titleKana,
              readFlag: book.readFlag,
              note: book.note,
            },
          },
          options
        );

        return true;
      } catch (error) {
        console.log("updateBooksAsync ERROR!", error);
        setModalType("none");
        setIconType("error");
        setModalMessage("エラーが発生しました");
        setModalIsOpen(true);
        return false;
      }
    },
    [book, user]
  );

  /**
   * 書籍を削除する
   */
  const deleteBookAsync = useCallback(
    async (item: Book): Promise<boolean> => {
      try {
        const session = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        const url = `${config.ApiEndpoint}/delete-book`;
        const options = {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        };

        await axios.post(
          url,
          {
            userName: user?.signInDetails?.loginId ?? "",
            seqno: item.seqno,
          },
          options
        );

        return true;
      } catch (error) {
        console.log("deleteBookAsync ERROR!", error);
        setModalType("none");
        setIconType("error");
        setModalMessage("エラーが発生しました");
        setModalIsOpen(true);
        return false;
      }
    },
    [user]
  );

  /**
   * 書籍を返却する
   */
  const returnBookAsync = useCallback(
    async (item: Book): Promise<boolean> => {
      try {
        const session = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        const url = `${config.ApiEndpoint}/return-book`;
        const options = {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        };

        await axios.post(
          url,
          {
            rental_id: item.rentalId,
          },
          options
        );

        return true;
      } catch (error) {
        console.log("returnBookAsync ERROR!", error);
        setModalType("none");
        setIconType("error");
        setModalMessage("エラーが発生しました");
        setModalIsOpen(true);
        return false;
      }
    },
    []
  );

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
    autoKana.current = AutoKana.bind("#formTitle", "#formTitleKana", {
      katakana: true,
    });

    console.log("useEffect[] end");
  }, []);

  /**
   * useEffect
   */
  useEffect(() => {
    console.log(
      "useEffect[user, getBookAsync, seqno, setIsLoadingOverlay] start"
    );

    (async () => {
      setIsLoadingOverlay(true);

      if (user && seqno) {
        const result = await getBookAsync(Number(seqno));
        console.log("getBookAsync result", result);

        if (result) {
          setBook(result);
        }
      }

      setIsLoadingOverlay(false);
    })();

    console.log(
      "useEffect[user, getBookAsync, seqno, setIsLoadingOverlay] end"
    );
  }, [user, getBookAsync, seqno, setIsLoadingOverlay]);

  useEffect(() => {
    console.log("★useEffect(setIsLoadingOverlay) called");
  }, [setIsLoadingOverlay]);

  /**
   * useEffect
   */
  useEffect(() => {
    console.log("useEffect[book] start");

    if (book?.title && book?.titleKana && book?.salesDate) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }

    console.log("useEffect[book] end");
  }, [book]);

  /**
   * タイトルが変更されたときのイベントハンドラ
   * @param e イベント引数
   */
  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    // AutoKanaの実行
    if (autoKana.current) {
      setBook({
        ...book,
        title: e.target.value,
        titleKana: autoKana.current.getFurigana(),
      });
    } else {
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
  const handleChangePublisherName = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
  const handleButtonClick = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setIsLoadingOverlay(true);

    const ret = await updateBooksAsync(book);

    setIsLoadingOverlay(false);

    if (ret) {
      navigate("/updateComplete", { replace: true });
    }
  };
  
  /**
   * 読んだフラグ変更イベント
   * @param checked チェック状態
   */
  const handleChangeReadFlag = (checked: boolean | "indeterminate") => {
    setBook({ ...book, readFlag: checked === true });
  };

  /**
   * 感想変更イベント
   * @param e イベント引数
   */
  const handleChangeNote = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBook({ ...book, note: e.target.value });
  };

  /**
   * 「削除する」ボタン押下イベント
   * @param e イベント引数
   */
  const handleDeleteButtonClick = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setProceedPhase(1);
    setModalType("yesNo");
    setIconType("info");
    setModalMessage("この書籍を削除しますか？");
    setModalIsOpen(true);
  };

  /**
   * 「返却する」ボタン押下イベント
   * @param e イベント引数
   */
  const handleReturnButtonClick = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setProceedPhase(2);
    setModalType("yesNo");
    setIconType("info");
    setModalMessage("この書籍を返却しますか？");
    setModalIsOpen(true);
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
    navigate("/");
  };

  /**
   * モーダルのYesイベント
   * @param e イベント引数
   */
  const handleYesModal = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetModal();

    // 「この書籍を削除しますか？」がYesの場合
    if (proceedPhase === 1) {
      setIsLoadingOverlay(true);
      const ret = await deleteBookAsync(book);
      setIsLoadingOverlay(false);
      if (ret) {
        navigate("/books", { replace: true });
      }

    // 「この書籍を返却しますか？」がYesの場合
    } else if (proceedPhase === 2) {
      setIsLoadingOverlay(true);
      const ret = await returnBookAsync(book);
      setIsLoadingOverlay(false);
      if (ret) {
        // 返却後、最新の書籍情報を取得して状態更新（貸出表示を即時非表示）
        const result = await getBookAsync(Number(seqno));
        if (result) {
          setBook(result);
        } else {
          // 取得に失敗した場合は最低限の状態を更新して貸出表示を消す
          setBook({
            ...book,
            lendFlag: false,
            renterUsername: undefined,
            rentalDate: undefined,
          });
        }
      }

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

  /**
   * エポック時間をYYYY/MM/DD HH:MM形式に変換する
   * @param epoc エポック時間
   * @returns フォーマット文字列
   */
  const formatEpocToYMDHM = (epoc: number): string => {
    const date = new Date(epoc);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  return (
    <ResponsiveLayout>
      <div className="mx-auto w-full max-w-2xl">
        <PageTitle title="書籍詳細" />
        <div className="glass flex flex-col gap-5 rounded-3xl p-5 md:p-8">
          {/* 書影が無い本（書影の保存前に登録した本など）には、タイトルの頭文字のプレースホルダを出す。読み込み前は何も出さない */}
          {(book.coverUrl || book.title) && (
            <div className="flex justify-center">
              <BookCover title={book.title} coverUrl={book.coverUrl} className="w-28 sm:w-32" />
            </div>
          )}
          <FormField
            required
            id="formTitle"
            label="タイトル"
            error={book.title === ""}
            value={book.title}
            onChange={handleChangeTitle}
          />
          <FormField
            required
            id="formTitleKana"
            label="タイトル（カナ）"
            error={book.titleKana === ""}
            value={book.titleKana}
            onChange={handleChangeTitleKana}
          />
          <FormField
            id="formAuthor"
            label="著者"
            value={book.author}
            onChange={handleChangeAuthor}
          />
          <FormField
            id="formPublisherName"
            label="出版社"
            value={book.publisherName}
            onChange={handleChangePublisherName}
          />
          <FormField
            required
            id="formSalesData"
            label="発売日"
            error={book.salesDate === ""}
            value={book.salesDate}
            onChange={handleChangeSalesDate}
          />
          <FormField
            id="formIsbn"
            label="ISBN"
            disabled={true}
            value={book.isbn}
            onChange={handleChangeIsbn}
          />
          {book.lendFlag && (
            <div className="flex flex-col gap-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <FormField
                id="formRenter"
                label="貸出中ユーザー"
                disabled={true}
                value={book.renterUsername ?? "不明"}
              />
              <FormField
                id="formRentalDate"
                label="貸出日時"
                disabled={true}
                value={formatEpocToYMDHM(book.rentalDate ?? 0)}
              />
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleReturnButtonClick}
              >
                返却する
              </Button>
            </div>
          )}
          <Label className="w-fit cursor-pointer gap-2 text-base">
            <Checkbox
              checked={book.readFlag}
              onCheckedChange={handleChangeReadFlag}
            />
            読んだ
          </Label>
          <div className="grid gap-2">
            <Label htmlFor="formNote">感想</Label>
            <Textarea
              id="formNote"
              rows={4}
              value={book.note}
              onChange={handleChangeNote}
              placeholder="この本についての感想を入力してください"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              disabled={isButtonDisabled}
              onClick={handleButtonClick}
            >
              登録する
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={handleDeleteButtonClick}
              disabled={book?.lendFlag ?? false}
            >
              {book?.lendFlag ?? false ? "貸出中のため削除できません" : "削除する"}
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={() => navigate("/books")}>
              一覧に戻る
            </Button>
          </div>
        </div>
      </div>
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

export default UpdateBook;
