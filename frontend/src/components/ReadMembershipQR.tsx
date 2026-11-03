import React, { useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { LoadingContext } from "../context/LoadingProvider";
import MessageModal from "./MessageModal";

import ResponsiveLayout from "./ResponsiveLayout";
import PageTitle from "./PageTitle";
import ScannerFrame from "./ScannerFrame";

const ReadMembershipQR: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");
  // const [disabled, setDisabled] = useState(false);

  /**
   * バーコードスキャンイベント
   */
  const handleScan = useCallback(async (results: IDetectedBarcode[]) => {
    setIsLoadingOverlay(true);

    if (results.length > 0) {
      const item = results[0];
      const renterUser = atob(item.rawValue);
      navigate("/lend/readBarcode", {
        state: {
          renterUser: renterUser
        }
      });
    }

    setIsLoadingOverlay(false);
  }, [
    navigate,
    setIsLoadingOverlay
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
        <PageTitle
          title="会員証QRコードを読み取ってください"
          description="借りる人の「会員証を提示」画面のQRコードを枠に合わせます"
        />
        <ScannerFrame>
          <Scanner
            onScan={handleScan}
            formats={['qr_code', 'micro_qr_code']}
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

export default ReadMembershipQR;
