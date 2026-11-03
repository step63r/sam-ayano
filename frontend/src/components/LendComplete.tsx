import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import CompletePanel from './CompletePanel';

/**
 * 貸出完了画面
 * @returns コンポーネント
 */
const LendComplete: React.FC = () => {
  const navigate = useNavigate();
  const [disabled, setDisabled] = useState(false);

  /**
   * 「ホームに戻る」ボタン押下イベント
   * @param e イベント引数
   */
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/');
  };

  return (
    <CompletePanel title="貸出完了" disabled={disabled} onBackHome={handleOnClick} />
  )
};

export default LendComplete;
