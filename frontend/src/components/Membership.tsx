import React, { useEffect, useState } from "react";
import { AuthUser, getCurrentUser } from "aws-amplify/auth";
import { QRCodeCanvas } from 'qrcode.react';

import {
  Divider,
  Stack,
  Typography,
} from '@mui/material';

import ResponsiveLayout from "./ResponsiveLayout";

/**
 * 会員情報画面
 * @returns コンポーネント
 */
const Membership: React.FC = () => {
  const [user, setUser] = useState<AuthUser>();
  const [userBase64, setUserBase64] = useState("");

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
    console.log("useEffect[user] start");

    if (user) {
      const encoded = btoa(user?.signInDetails?.loginId ?? "");
      setUserBase64(encoded);
    }

    console.log("useEffect[user] end");
  }, [user]);

  return (
    <ResponsiveLayout>
      <Stack spacing={2} direction="column" alignItems="center" sx={{ width: '100%', pb: 6 }}>
        <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center' }}>
          会員証QRコード
        </Typography>
        <Divider sx={{ width: '100%' }} />
        {user && (
          <QRCodeCanvas
            value={userBase64}
            size={192}
          />
        )}
        {/* <TextField
          value={userBase64}
          fullWidth
          variant="outlined"
          InputProps={{ readOnly: true }}
          onFocus={(e) => {
            const el = e.target as HTMLInputElement;
            el.select();
          }}
          onClick={(e) => {
            const el = e.target as HTMLInputElement;
            el.select();
          }}
        /> */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ position: 'fixed', bottom: 8, left: 0, right: 0, textAlign: 'center', zIndex: 1000 }}
        >
          QRコードは株式会社デンソーウェーブの登録商標です
        </Typography>
      </Stack>
    </ResponsiveLayout>
  );
};

export default Membership;
