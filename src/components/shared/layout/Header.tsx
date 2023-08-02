import styled from 'styled-components';
import { GiSkullCrossedBones } from 'react-icons/gi';
import { enableBodyScroll } from 'body-scroll-lock';
import { toast } from 'react-toastify';
import useHederaAccountNFTs from '@src/utils/hooks/useHederaAccountNFTs';
import { Client, AccountBalanceQuery, TransferTransaction } from '@hashgraph/sdk';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';


import { Link, useLocation } from 'react-router-dom';
import { useOnClickAway } from 'use-on-click-away';

import { ModalContext } from '@utils/context/ModalContext';
import { HomepageContext } from '@utils/context/HomepageContext';
import useHederaWallets, { ConnectionStateType } from '@hooks/useHederaWallets';
import useLayout from '@utils/hooks/useLayout';

import ConnectionModal from '@components/shared/modals/ConnectionModal';
import { AppContext } from '@src/utils/context/context';
import { HederaWalletsContext } from '@src/utils/context/HederaWalletsContext';


import MirrorNode, { GroupedNFTsByCollectionIdWithInfo } from '@services/MirrorNode';
import IPFS from '@src/services/IPFS';


const Header = () => {
  const { connectedWalletType, userWalletId } = useHederaWallets();
  const { showModal, setModalContent } = useContext(ModalContext);
  const { isMobileSmall } = useLayout();
  const { resetHomepageData, isMinterWizardWelcomeScreen } = useContext(HomepageContext);
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);
  const expandedMenuRef = useRef(null);
  const [isMobileNavbarMenuExpanded, setIsMobileNavbarMenuExpanded] =
    useState(false);

  const AppData = useContext(AppContext);
  const {
    hashConnect,
    hashConnectState,
  } = useContext(HederaWalletsContext);

  const handleShowModal = useCallback(() => {
    setModalContent(<ConnectionModal />);
    showModal();
  }, [setModalContent, showModal]);

  const isMobileNavbarMenuToogled = useMemo(() => (
    isMobileSmall && isMobileNavbarMenuExpanded
  ), [isMobileSmall, isMobileNavbarMenuExpanded]);


  const closeNavbar = useCallback(() => {
    if (headerRef?.current) {
      enableBodyScroll(headerRef.current);
      setIsMobileNavbarMenuExpanded(false);
    }
  }, [setIsMobileNavbarMenuExpanded]);

  useOnClickAway(headerRef, () => {
    closeNavbar();
  });

  const handleLogoClick = useCallback(() => (
    location.pathname === '/'
      ? resetHomepageData()
      : null
  ), [location.pathname, resetHomepageData])

  const {
    collections,
    loading,
    fetchHederaAccountNFTs
  } = useHederaAccountNFTs(userWalletId)

  useEffect(() => {


    (async () => {

      let groupedCollections;
  
      try {
        const accountId = userWalletId ?? null;
  
        if (!accountId) {
          throw new Error('No account ID! Connect wallet first.');
        }

        if (AppData.NFTIndex === -1) {
          const fetchedNfts = await MirrorNode.fetchAllNFTs(accountId);

          let metadata = {};

          console.log('fetchedNfts: ', fetchedNfts);
  
          AppData.setNFTList(fetchedNfts);
  
          if (fetchedNfts.length === 0) {
            toast.info("You don't have any NFT");
          } else if (fetchedNfts.length === 1) {
            AppData.setNFTIndex(0);

            const fetchedMetadata = await IPFS.fetchData(fetchedNfts[0].metadata);

            metadata = {...fetchedNfts[0], ...fetchedMetadata};

            AppData.setSelectedNFTData(metadata)

          } else  if (fetchedNfts.length > 1 ) {
            
          }
        }
  
  
      } catch (e) {
        console.log(e);
      }
    })()

  }, [userWalletId])

  useEffect(() => {
    (async () => {
      const client = Client.forMainnet();

      const balanceQuery = await new AccountBalanceQuery().setAccountId('0.0.3239335')
        .execute(client);
      
      let bal = balanceQuery.tokens?._map.get(AppData.FTContract)?.low;

      AppData.setBalance(Number(bal));

    })()
  }, [AppData.renderFlag])
  
  return (
    <HeaderWrapper>
      <TopHeader>
        <GiSkullCrossedBones></GiSkullCrossedBones>
        <p>THE BONES CHATROOM</p>
      </TopHeader>
      <NavBarContainer>
        <Pages>
          <NavBarLink>
            <Link to='/'>Home</Link>
          </NavBarLink>
          <NavBarLink>
            <Link to='#'>Marketplace</Link>
          </NavBarLink>
          <NavBarLink>
            <Link to='#'>Bank</Link>
          </NavBarLink>
          {
            connectedWalletType !== ConnectionStateType.NOCONNECTION ? (
              <NavBarLink>
                <Link to='/mynfts'>My NFTs</Link>
              </NavBarLink>
            ) : undefined
          }
        </Pages>
        <Pages>
          <NavBarLink>
            <a onClick={handleShowModal}>
              {connectedWalletType === ConnectionStateType.NOCONNECTION ? (
                'Connect'
              ) : (
                `Connected ${userWalletId}`
              )}
            </a>
          </NavBarLink>
          <NavBarLink>
            {
              userWalletId && AppData.NFTIndex !== -1 && AppData.selectedNFTData ? (
                <img src={AppData.selectedNFTData.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} />
              )
              : null
            }
          </NavBarLink>
          <NavBarLink>
            <a>
             {
              userWalletId && "bal: " + AppData.balance
             }
            </a>
          </NavBarLink>
        </Pages>
      </NavBarContainer>
    </HeaderWrapper>
  );
};

const HeaderWrapper = styled.div`
  background-color: #090909;
`

const TopHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;

  color: #99FFAF;
  font-size: 40px;
  p {
    margin: 0;
  }
  border-bottom: 2px #99FFAF solid;
`

const NavBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
`

const Pages = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
`

const NavBarLink = styled.div`
  text-align: center;
  padding: 10px;
  cursor: pointer;
  a {
    font-size: 20px;
    color: #99FFAF;
    text-decoration: none;
  }

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
`

export default Header;
