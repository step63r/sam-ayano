import React, {  useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { LoadingContext } from "../context/LoadingProvider";
import {
  Button,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography
} from "@mui/material";

const ReadBarcode: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);

  const handleScan = (results: IDetectedBarcode[]) => {
    if (results.length > 0) {
      for (const item of results) {
        if (item.rawValue.startsWith("978") || item.rawValue.startsWith("979")) {
          console.log(item);
          setIsLoadingOverlay(true);
          navigate('/book', {
            state: {
              isbnjan: item.rawValue
            },
          });
        }
      }
    }
  };

  const handleManualInput = () => {
    navigate('/book');
  };

  return (
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
        <Button fullWidth variant="text" onClick={handleManualInput}>
          バーコードが読み取れない場合
        </Button>
      </Stack>
    </Grid>
    
  );
}

export default ReadBarcode;
