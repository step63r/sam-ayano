import { Box } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { FC, memo } from "react";
import { CircularProgress } from "@mui/material";

export const LoadingOverLay: FC<{ isLoadingOverlay: boolean }> = memo(({ isLoadingOverlay }) => {
  return (
    <AnimatePresence mode="wait">
      {isLoadingOverlay && (
        <motion.div
          key="loading-overLay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100vh', zIndex: '999', color: 'rgba(0,0,0,0.3)' }}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%' }}>
              <CircularProgress />
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
