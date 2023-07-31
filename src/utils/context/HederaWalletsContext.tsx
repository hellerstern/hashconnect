import React from 'react';
import { BladeSigner } from '@bladelabs/blade-web3.js';
import { HashConnect } from 'hashconnect';
import useHashPack, {
  HashConnectState,
} from '@src/utils/hooks/wallets/useHashPack';
import useBladeWallet, {
  BladeAccountId,
} from '@utils/hooks/wallets/useBladeWallet';

interface HederaWalletsContextType {
  bladeSigner?: BladeSigner;
  hashConnect?: HashConnect;
  hashConnectState: Partial<HashConnectState>;
  bladeAccountId: BladeAccountId;
  connectBladeWallet: () => void;
  connectToHashPack: () => void;
  clearConnectedBladeWalletData: () => void;
  disconnectFromHashPack: () => void;
  isIframeParent: boolean;
}

const INITIAL_CONTEXT: HederaWalletsContextType = {
  hashConnect: undefined,
  bladeSigner: undefined,
  hashConnectState: {},
  bladeAccountId: '',
  disconnectFromHashPack: () => undefined,
  connectBladeWallet: () => undefined,
  connectToHashPack: () => undefined,
  clearConnectedBladeWalletData: () => undefined,
  isIframeParent: false
};

export const HederaWalletsContext = React.createContext(INITIAL_CONTEXT);

export default function HederaWalletsProvider({
  children,
}: {
  children: React.ReactElement;
}) {
  const {
    bladeSigner,
    bladeAccountId,
    connectBladeWallet,
    clearConnectedBladeWalletData,
  } = useBladeWallet();

  const {
    hashConnect,
    hashConnectState,
    connectToHashPack,
    disconnectFromHashPack,
    isIframeParent
  } = useHashPack();

  return (
    <HederaWalletsContext.Provider
      value={{
        bladeSigner,
        hashConnect,
        hashConnectState,
        bladeAccountId,
        connectBladeWallet,
        disconnectFromHashPack,
        clearConnectedBladeWalletData,
        connectToHashPack,
        isIframeParent,
      }}
    >
      {children}
    </HederaWalletsContext.Provider>
  );
}
