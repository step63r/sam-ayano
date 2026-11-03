import React, { useEffect, useState } from "react";
import { AuthUser, getCurrentUser } from "aws-amplify/auth";
import { QRCodeCanvas } from 'qrcode.react';

import ResponsiveLayout from "./ResponsiveLayout";
import PageTitle from "./PageTitle";

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
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
        <PageTitle title="会員証QRコード" description="本を借りるときは、貸す人にこのQRコードを読み取ってもらいます" />
        {user && (
          // QRコードはテーマに関わらず白地に黒でないと読み取りにくいため、背景は常に白にする
          <div className="glass rounded-3xl p-4">
            <div className="rounded-2xl bg-white p-4">
              <QRCodeCanvas
                value={userBase64}
                size={192}
              />
            </div>
          </div>
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
        {/* 下部ナビに重ならないよう、画面固定ではなく本文の末尾に置く */}
        <p className="text-center text-xs text-muted-foreground">
          QRコードは株式会社デンソーウェーブの登録商標です
        </p>
      </div>
    </ResponsiveLayout>
  );
};

export default Membership;
