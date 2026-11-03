import React, {  useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput, fetchAuthSession } from "aws-amplify/auth";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { LoadingContext } from "../context/LoadingProvider";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import { Keyboard, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";

import ResponsiveLayout from './ResponsiveLayout';
import PageTitle from "./PageTitle";
import { Book } from "../types/book";

/**
 * バーコード読取画面
 * @returns コンポーネント
 */
const ReadBarcode: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<GetCurrentUserOutput>();
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
          readFlag: false,
          note: "",
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
          readFlag: false,
          note: "",
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

  /**
   * バーコードスキャンイベント
   */
  const handleScan = useCallback(async (results: IDetectedBarcode[]) => {
    setIsLoadingOverlay(true);

    if (results.length > 0) {
      for (const item of results) {
        if (item.rawValue.startsWith("978") || item.rawValue.startsWith("979")) {
          console.log(item);
          setIsbn(item.rawValue);
          const isExists = await checkExistsAsync(item.rawValue);
          if (isExists) {
            setProceedPhase(1);
            setModalType("yesNo");
            setIconType("warn");
            setModalMessage("この書籍は登録済みです。\n続けますか？");
            setModalIsOpen(true);
          } else {
            const ret = await searchOpenBdAsync(item.rawValue);
            if (ret) {
              navigate("/book", {
                state: {
                  book: ret
                }
              });
            } else {
              // Rakuten Books APIでも探してみる
              const ret2 = await searchRakutenBookAsync(item.rawValue);
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
        }
      }
    }

    setIsLoadingOverlay(false);
  }, [
    checkExistsAsync,
    navigate,
    setIsLoadingOverlay,
    searchOpenBdAsync,
    searchRakutenBookAsync]);

  /**
   * モーダルを閉じるイベント
   * @param e イベント引数
   */
  const handleCloseModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetModal();
    navigate('/');
  };

  /**
   * モーダルのYesイベント
   * @param e イベント引数
   */
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
            readFlag: false,
            note: "",
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
  }

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
   * 「バーコードが読み取れない場合」ボタン押下イベント
   * @param e イベント引数
   */
  const handleManualInput = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/book');
  };

  /**
   * 「ISBNを手動で入力する」ボタン押下イベント
   * @param e イベント引数
   */
  const handleInputIsbnJan = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/inputIsbnJan');
  };

  return (
    <>
      <ResponsiveLayout>
        <div className="mx-auto w-full max-w-xl">
          <PageTitle
            title="バーコードを読み取ってください"
            description="本の裏表紙にある「978」または「979」で始まるバーコードを枠に合わせます"
          />
          {/* カメラ映像をガラスの枠に収める。overflow-hidden で映像の角も丸める */}
          <div className="glass overflow-hidden rounded-3xl p-2">
            <div className="overflow-hidden rounded-2xl">
              <Scanner
                onScan={handleScan}
                formats={['ean_13']}
                components={{
                  audio: false,
                }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Button variant="outline" size="lg" className="w-full" disabled={disabled} onClick={handleManualInput}>
              <PencilLine /> バーコードが読み取れない場合
            </Button>
            <Button variant="outline" size="lg" className="w-full" disabled={disabled} onClick={handleInputIsbnJan}>
              <Keyboard /> ISBNを手動で入力する
            </Button>
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
    </>
  );
}

export default ReadBarcode;
