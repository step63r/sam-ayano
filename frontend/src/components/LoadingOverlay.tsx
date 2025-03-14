import { Box } from "@mui/material";
import { FC, memo } from "react";
import { CircularProgress } from "@mui/material";

/**
 * プログレスリング表示用のオーバーレイコンポーネント
 */
export const LoadingOverLay: FC<{ isLoadingOverlay: boolean }> = memo(({ isLoadingOverlay }) => {
  return (
    <>
      {isLoadingOverlay && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: '999', color: 'rgba(0,0,0,0.3)', background: 'rgba(255,255,255,0.5)' }}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <CircularProgress />
          </Box>
      </Box>
      )}
    </>
  );
});
