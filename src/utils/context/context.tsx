import { useState, createContext } from "react";


type AppContextProps = {
  FTContract: string,
  NFTContract: string,
  NFTList: any[],
  setNFTList: React.Dispatch<React.SetStateAction<any>>
  NFTIndex: number,
  setNFTIndex: React.Dispatch<React.SetStateAction<number>>
  selectedNFTData: any,
  setSelectedNFTData: React.Dispatch<React.SetStateAction<any>>,
  balance: number,
  setBalance: React.Dispatch<React.SetStateAction<number>>,
  renderFlag: number,
  setRenderFlag: React.Dispatch<React.SetStateAction<number>>,
}

const INITIAL_CONTEXT: AppContextProps = {
  FTContract: '',
  NFTContract: '',
  NFTList: [],
  setNFTList: () => null,
  NFTIndex: 0,
  setNFTIndex: () => null,
  selectedNFTData: null,
  setSelectedNFTData: () => null,
  balance: 0,
  setBalance: () => null,
  renderFlag: 0,
  setRenderFlag: () => null
};

export const AppContext = createContext(INITIAL_CONTEXT);

export const AppContextProvider = ({ children }: {
  children: React.ReactElement
}) => {

  const [NFTList, setNFTList] = useState([]);
  const [NFTIndex, setNFTIndex] = useState(-1);
  const [selectedNFTData, setSelectedNFTData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [renderFlag, setRenderFlag] = useState(0);
  

  const value = {
    FTContract: '0.0.1462146',
    NFTContract: '0.0.1413693',
    NFTList,
    setNFTList,
    NFTIndex, 
    setNFTIndex,
    selectedNFTData,
    setSelectedNFTData,
    balance,
    setBalance,
    renderFlag, 
    setRenderFlag
  }

  return (
    <AppContext.Provider value={
      value
    }>
      {children}
    </AppContext.Provider>
  )
}