import React from "react";
import Modal from "react-modal";

import {
  Button,
  Stack,
  Typography
} from "@mui/material";

import {
  Info,
  Warning,
  Error
} from "@mui/icons-material";

Modal.setAppElement("#root");

/**
 * MessageModalコンポーネントのプロパティ
 */
type MessageModalProps = {
  /** 表示フラグ */
  isOpen: boolean;
  /** モーダル種別 */
  modalType: "none" | "yesNo";
  /** アイコン種別 */
  iconType: "none" | "info" | "warn" | "error";
  /** メッセージ */
  message: string;
  /** 閉じるイベント */
  handleClose?: React.MouseEventHandler<HTMLButtonElement>;
  /** Yesイベント */
  handleYes?: React.MouseEventHandler<HTMLButtonElement>;
  /** Noイベント */
  handleNo?: React.MouseEventHandler<HTMLButtonElement>;
};

/**
 * 独自のモーダルスタイル定義
 */
const modalStyles: Modal.Styles = {
  content: {
    position: "absolute",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    minWidth: "80%",
    maxWidth: "80%",
    minHeight: "25%",
    maxHeight: "80%",
    padding: "16px",
  },
  overlay: {
    zIndex: 1000
  },
};

/**
 * メッセージ用モーダル
 * @param param0 プロパティ
 * @returns コンポーネント
 */
const MessageModal: React.FC<MessageModalProps> = (
  {
    isOpen,
    modalType,
    iconType,
    message,
    handleClose,
    handleYes,
    handleNo
  }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={modalStyles}
      shouldCloseOnOverlayClick={false}
    >
      <Stack spacing={2} direction="column">
        {iconType === "info" && (
          <Info color="info" sx={{ fontSize: "48px", display: "block", alignSelf: "center" }} />
        )}
        {iconType === "warn" && (
          <Warning color="warning" sx={{ fontSize: "48px", display: "block", alignSelf: "center" }} />
        )}
        {iconType === "error" && (
          <Error color="error" sx={{ fontSize: "48px", display: "block", alignSelf: "center" }} />
        )}
        <Typography variant="subtitle1" sx={{ whiteSpace: 'pre-line' }}>{message}</Typography>
        {modalType === "none" && (
          <Button fullWidth variant="contained" onClick={handleClose}>閉じる</Button>
        )}
        {modalType === "yesNo" && (
          <Stack spacing={2} direction="row">
            <Button fullWidth variant="outlined" onClick={handleNo}>いいえ</Button>
            <Button fullWidth variant="contained" onClick={handleYes}>はい</Button>
          </Stack>
        )}
      </Stack>
    </Modal>
  )
};

export default MessageModal;
