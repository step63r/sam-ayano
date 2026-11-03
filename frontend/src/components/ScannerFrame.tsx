import React from "react";

/**
 * カメラ映像をガラスの枠に収める
 * overflow-hidden で映像の角も丸める
 */
const ScannerFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="glass overflow-hidden rounded-3xl p-2">
    <div className="overflow-hidden rounded-2xl">{children}</div>
  </div>
);

export default ScannerFrame;
