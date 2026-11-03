import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput, fetchAuthSession } from "aws-amplify/auth";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { LoadingContext } from "../context/LoadingProvider";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import ResponsiveLayout from "./ResponsiveLayout";
import PageTitle from "./PageTitle";
import ScannerFrame from "./ScannerFrame";
import { Book } from "../types/book";

const ReadLendBarcode: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const location = useLocation();
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");
  const [renterUser, setRenterUser] = useState<string>("");
  const [renterEmail, setRenterEmail] = useState<string>("");

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
    if (location.state?.renterUser) {
      setRenterUser(location.state?.renterUser);
    }
    if (location.state?.renterEmail) {
      setRenterEmail(location.state?.renterEmail);
    }
  }, [location]);

  /**
   * 貸出可能な書籍があるか取得する
   */
  const getLendBookAsync = useCallback(async (isbn: string): Promise<Book | undefined> => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const url = `${config.ApiEndpoint}/get-lend-book`;
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      };

      const response = await axios.post(url, {
        isbn: isbn,
      }, options);

      if (response.data) {
        return response.data.item as Book;
      }
    } catch (error) {
      console.log("getLendBookAsync ERROR!", error);
      setIconType("error");
      setModalMessage(error instanceof Error ? error.message : "エラーが発生しました");
      setModalIsOpen(true);
    }
  }, [user]);

  /**
   * 貸出処理を行う
   */
  const lendBookAsync = useCallback(async (renter_username: string, renter_email: string, isbn: string): Promise<boolean | undefined> => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const url = `${config.ApiEndpoint}/lend-book`;
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      };

      await axios.post(url, {
        renter_username: renter_username,
        renter_email: renter_email,
        isbn: isbn,
      }, options);

      return true;
    } catch (error) {
      console.log("lendBookAsync ERROR!", error);
      setIconType("error");
      setModalMessage("エラーが発生しました");
      setModalIsOpen(true);
      return false;
    }
  }, []);

  /**
   * バーコードスキャンイベント
   */
  const handleScan = useCallback(async (results: IDetectedBarcode[]) => {
    setIsLoadingOverlay(true);

    if (results.length > 0) {
      for (const item of results) {
        const isbn = item.rawValue;
        if (isbn.startsWith("978") || isbn.startsWith("979")) {
          console.log(item);
          const book = await getLendBookAsync(isbn);
          if (book) {
            const ret = await lendBookAsync(
              renterUser,
              renterEmail,
              isbn
            );

            if (ret) {
              navigate('/lend/complete', { replace: true });
            }
          }
        }
      }
    }

    setIsLoadingOverlay(false);
  }, [
    
    getLendBookAsync,
    lendBookAsync,
    navigate,
    setIsLoadingOverlay,
    renterUser,
    renterEmail,
    user,
  ]);

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
      <div className="mx-auto w-full max-w-xl">
        <PageTitle title="書籍のバーコードを読み取ってください" />
        <ScannerFrame>
          <Scanner
            onScan={handleScan}
            formats={['ean_13']}
            components={{
              audio: false,
            }}
          />
        </ScannerFrame>
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
};

export default ReadLendBarcode;
