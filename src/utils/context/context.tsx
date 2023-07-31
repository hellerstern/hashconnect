import { useState, createContext } from "react";


type AppContextProps = {
  FTContract: string,
  NFTContract: string
}

const INITIAL_CONTEXT: AppContextProps = {
  FTContract: '',
  NFTContract: ''
};

export const AppContext = createContext(INITIAL_CONTEXT);

export const AppContextProvider = ({ children }: {
  children: React.ReactElement
}) => {

  const value = {
    FTContract: '0.0.1462146',
    NFTContract: '0.0.1413693'
  }

  return (
    <AppContext.Provider value={
      value
    }>
      {children}
    </AppContext.Provider>
  )
}