import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput, fetchAuthSession } from "aws-amplify/auth";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { LoadingContext } from "../context/LoadingProvider";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import {
  Divider,
  Stack,
  Typography
} from '@mui/material';

import ResponsiveLayout from "./ResponsiveLayout";
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
        userName: user?.signInDetails?.loginId ?? '',
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
  const lendBookAsync = useCallback(async (lender_usename: string, renter_username: string, isbn: string): Promise<boolean | undefined> => {
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
        lender_username: lender_usename,
        renter_username: renter_username,
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
              user?.signInDetails?.loginId ?? '',
              renterUser,
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
      <Stack spacing={2} direction='column'>
        <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center' }}>
          書籍のバーコードを読み取ってください
        </Typography>
        <Divider />
        <Scanner
          onScan={handleScan}
          formats={['ean_13']}
          components={{
            audio: false,
          }}
        />
      </Stack>
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
