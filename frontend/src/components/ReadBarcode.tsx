import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';

const ReadBarcode: React.FC = () => {
  const navigate = useNavigate();

  const handleScan = (results: IDetectedBarcode[]) => {
    if (results.length > 0) {
      for (const item of results) {
        if (item.rawValue.startsWith("978") || item.rawValue.startsWith("979")) {
          console.log(item);
          navigate('/book');
        }
      }
    }
  };

  return (
    <Authenticator>
      <Scanner
        onScan={handleScan}
        formats={['ean_13']}
        components={{
          audio: false,
        }}
      />
    </Authenticator>
  );
}

export default ReadBarcode;
