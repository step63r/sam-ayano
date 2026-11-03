import React, { useEffect, useState } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { QRCodeCanvas } from 'qrcode.react';

import { encodeMembership } from "@/lib/membership";

import ResponsiveLayout from "./ResponsiveLayout";
import PageTitle from "./PageTitle";

/**
 * 会員情報画面
 * @returns コンポーネント
 */
const Membership: React.FC = () => {
  const [qrValue, setQrValue] = useState("");

  /**
   * useEffect
   */
  useEffect(() => {
    console.log("useEffect[] start");

    (async () => {
      try {
        // サインイン時に保存された loginId はメールアドレスを変更しても古いままなので、最新の値を取得する
        const attributes = await fetchUserAttributes();
        if (attributes.sub) {
          setQrValue(encodeMembership({ sub: attributes.sub, email: attributes.email ?? "" }));
        }
      } catch (error) {
        console.log("fetchUserAttributes ERROR!", error);
      }
    })();

    console.log("useEffect[] end");
  }, []);

  return (
    <ResponsiveLayout>
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
        <PageTitle title="会員証QRコード" description="本を借りるときは、貸す人にこのQRコードを読み取ってもらいます" />
        {qrValue && (
          // QRコードはテーマに関わらず白地に黒でないと読み取りにくいため、背景は常に白にする
          <div className="glass rounded-3xl p-4">
            <div className="rounded-2xl bg-white p-4">
              <QRCodeCanvas
                value={qrValue}
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
