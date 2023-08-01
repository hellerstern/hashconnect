import { useState, createContext } from "react";


type AppContextProps = {
  FTContract: string,
  NFTContract: string,
  NFTList: any[],
  setNFTList: React.Dispatch<React.SetStateAction<any>>
}

const INITIAL_CONTEXT: AppContextProps = {
  FTContract: '',
  NFTContract: '',
  NFTList: [],
  setNFTList: () => null
};

export const AppContext = createContext(INITIAL_CONTEXT);

export const AppContextProvider = ({ children }: {
  children: React.ReactElement
}) => {

  const [NFTList, setNFTList] = useState([]);

  const value = {
    FTContract: '0.0.1462146',
    NFTContract: '0.0.1413693',
    NFTList,
    setNFTList
  }

  return (
    <AppContext.Provider value={
      value
    }>
      {children}
    </AppContext.Provider>
  )
}