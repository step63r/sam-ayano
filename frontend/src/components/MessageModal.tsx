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

type MessageModalProps = {
  isOpen: boolean
  iconType: "none" | "info" | "warn" | "error"
  message: string
  handleClose: React.MouseEventHandler<HTMLButtonElement>;
};

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
  }
};

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, iconType, message, handleClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={modalStyles}
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
        <Typography variant="subtitle1">{message}</Typography>
        <Button fullWidth variant="contained" onClick={handleClose}>閉じる</Button>
      </Stack>
    </Modal>
  )
};

export default MessageModal;
