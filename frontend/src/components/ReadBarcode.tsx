import React, {  useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, GetCurrentUserOutput } from "aws-amplify/auth";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { LoadingContext } from "../context/LoadingProvider";
import axios from "axios";

import config from "../config.json";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography
} from "@mui/material";
import { GetBooksResponse } from "../types/book";

const ReadBarcode: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [isCheckExists, setIsCheckExists] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getCurrentUserAsync = async () => {
      const result = await getCurrentUser();
      console.log(result);
      setUser(result);
  };

  const getBooksAsync = async (isbn: string): Promise<GetBooksResponse | undefined> => {
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
      });
    
    return Promise.resolve(ret);
  };
  
  useEffect(() => {
    getCurrentUserAsync();

    if (location.state?.checkExists) {
      setIsCheckExists(true);
    }
  }, [location.state?.checkExists]);

  useEffect(() => {

  }, [setIsLoadingOverlay]);

  const handleScan = async (results: IDetectedBarcode[]) => {
    if (results.length > 0) {
      for (const item of results) {
        if (item.rawValue.startsWith("978") || item.rawValue.startsWith("979")) {
          console.log(item);
          if (isCheckExists) {
            setIsLoadingOverlay(true);
            const ret = await getBooksAsync(item.rawValue);
            setIsLoadingOverlay(false);
            if (ret!.items.length > 0) {
              setDialogMessage("この書籍を1冊以上所有しています");
            } else {
              setDialogMessage("この書籍を1冊も所有していません");
            }
            setIsDialogOpen(true);

          } else {
            navigate('/book', {
              state: {
                isbnjan: item.rawValue
              },
            });
          }
        }
      }
    }
  };

  const handleDialogConfirm = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setIsDialogOpen(false);
    navigate('/');
  };

  const handleManualInput = () => {
    navigate('/book');
  };

  return (
    <>
      <Grid marginX={2}>
        <Stack spacing={2} direction='column'>
          <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center', paddingTop: 2 }}>
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
          {!isCheckExists && (
            <Button fullWidth variant="text" onClick={handleManualInput}>
              バーコードが読み取れない場合
            </Button>
          )}
        </Stack>
      </Grid>
      <Dialog open={isDialogOpen}>
        <DialogContent>
          <DialogContentText>
            {dialogMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogConfirm}>確認しました</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ReadBarcode;
