import React, {  useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput } from "aws-amplify/auth";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { LoadingContext } from "../context/LoadingProvider";
import axios from "axios";
import MessageModal from "./MessageModal";

import config from "../config.json";

import {
  Button,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography
} from "@mui/material";
import { Book, GetBooksResponse } from "../types/book";

/**
 * バーコード読取画面
 * @returns コンポーネント
 */
const ReadBarcode: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");
  const [disabled, setDisabled] = useState(false);
  // eslint-disable-next-line
  const [checkExists, _setCheckExists]
    = useState<{ checkExists: boolean }>(location.state as { checkExists: boolean });

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
      const url = `${config.ApiEndpoint}/search-openbd`;
      const response = await axios.post(url, {
        isbnjan: isbnjan
      });

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
   * 書籍情報を取得する
   */
  const getBooksAsync = useCallback(async (isbn: string): Promise<GetBooksResponse | undefined> => {
    const url = `${config.ApiEndpoint}/get-books`;
    let ret: GetBooksResponse = { items: [] };

    await axios.post(url, {
      userName: user?.signInDetails?.loginId ?? '',
      pageSize: 1,
      isbn: isbn,
    })
      .then(response => {
        ret = response.data;
      })
      .catch(error => {
        console.log(error);
        setIconType("error");
        setModalMessage("エラーが発生しました");
        setModalIsOpen(true);
      });
    
    return Promise.resolve(ret);
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
          if (checkExists) {
            const ret = await getBooksAsync(item.rawValue);
            if (ret!.items.length > 0) {
              setIconType("info");
              setModalMessage("この書籍を1冊以上所有しています");
            } else {
              setIconType("info");
              setModalMessage("この書籍を1冊も所有していません");
            }
            setModalIsOpen(true);

          } else {
            const ret = await searchOpenBdAsync(item.rawValue);
            if (ret) {
              navigate('/book', {
                state: {
                  book: ret
                }
              });
            } else {
              setIconType("warn");
              setModalMessage("書籍が見つかりませんでした");
              setModalIsOpen(true);
            }
          }
        }
      }
    }

    setIsLoadingOverlay(false);
  }, [getBooksAsync, checkExists, navigate, setIsLoadingOverlay, searchOpenBdAsync]);

  /**
   * モーダルを閉じるイベント
   * @param e イベント引数
   */
  const handleCloseModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setModalIsOpen(false);
    setIconType("none");
    setModalMessage("");
    navigate('/');
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

  return (
    <>
      <Grid margin={2} paddingBottom={2}>
        <Stack spacing={2} direction='column'>
          <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center' }}>
            バーコードを読み取ってください
          </Typography>
          <Divider />
          <Scanner
            onScan={handleScan}
            formats={['ean_13']}
            components={{
              audio: false,
            }}
          />
          {!checkExists && (
            <Button fullWidth disabled={disabled} variant="text" onClick={handleManualInput}>
              バーコードが読み取れない場合
            </Button>
          )}
        </Stack>
        <MessageModal
          iconType={iconType}
          isOpen={modalIsOpen}
          message={modalMessage}
          handleClose={handleCloseModal}
        />
      </Grid>
    </>
  );
}

export default ReadBarcode;
