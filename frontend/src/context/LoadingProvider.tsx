import { createContext, FC, ReactNode, useState } from "react";

type LoadingContextType = {
  isLoadingOverlay: boolean;
  setIsLoadingOverlay: (value: boolean) => void;
};

export const LoadingContext = createContext({} as LoadingContextType);

export const LoadingProvider: FC<{ children: ReactNode }> = (props) => {
  const { children } = props;

  const [isLoadingOverlay, setIsLoadingOverlay] = useState(false);
  return (
    <LoadingContext.Provider value={{ isLoadingOverlay, setIsLoadingOverlay }}>
      {children}
    </LoadingContext.Provider>
  );
};
