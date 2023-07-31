import styled from 'styled-components';
import { GiSkullCrossedBones } from 'react-icons/gi';
import { enableBodyScroll } from 'body-scroll-lock';
import classNames from 'classnames';
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

  const headerClassnames = classNames('header', {
    'header--shade': location.pathname === '/' && isMinterWizardWelcomeScreen,
    'is-mobile': isMobileSmall,
  });

  const mobileNavbarExpandedMenuClassnames = classNames(
    'header__mobile-menu__wrapper',
    {
      'header__mobile-menu__is-hide': !isMobileNavbarMenuToogled,
    }
  );

  const connectIconClassName = classNames('icon__connect', {
    'icon--active': connectedWalletType !== ConnectionStateType.NOCONNECTION
  })

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

  useEffect(() => {
    (async () => {
      const client = Client.forMainnet();

      client.setOperator

      const balanceQuery = await new AccountBalanceQuery().setAccountId('0.0.3239335')
        .execute(client);

      console.log("balanceQuery: ", balanceQuery.tokens?._map.get(AppData.FTContract)?.low);
    })()
  })



  useEffect(() => {
    (async () => {

      const tokenId = AppData.FTContract;
      const accountId1 = '0.0.3239335';
      const accountId2 = '0.0.1229586';
      const client = Client.forMainnet();

      const provider = hashConnect?.getProvider("mainnet", hashConnectState.topic || '', accountId1);
      if (provider) {
        const signer = hashConnect?.getSigner(provider);

        if (signer) {
          let trans = await new TransferTransaction()
            .addTokenTransfer(tokenId, accountId1, -1)
            .addTokenTransfer(tokenId, accountId2, 1)
            .freezeWithSigner(signer);
          let res = await trans.executeWithSigner(signer);
        }
      }
    })()
  })

  return (
    // <header className={headerClassnames} ref={headerRef}>
    //   <div className={classNames('header-container', 'container--padding')}>
    //     <Link onClick={handleLogoClick} className='header__logo' to='/'>
    //       <img src={Logo} alt='hedera_logo' height={66} width={110} />{' '}
    //     </Link>
    //     {!isMobileSmall ? (
    //         <div className='header__buttons-wrapper'>
    //           <Link to='/my-nft-collection' className='icon__profile'>
    //             <img src={ProfileIcon} alt='profile_icon' />
    //             <p>
    //               My NFT <br />
    //               Collection
    //             </p>
    //           </Link>

    //           <button onClick={handleShowModal} className={connectIconClassName}>
    //             <img src={ConnectIcon} alt='wallet_connect_icon' />
    //             <div>
    //               <SwitchTransition>
    //                 <CSSTransition
    //                   key={connectedWalletType}
    //                   addEndListener={(node, done) => node.addEventListener('transitionend', done, false)}
    //                   classNames='fade'
    //                 >
    //                   <div>
    //                     {connectedWalletType === ConnectionStateType.NOCONNECTION ? (
    //                       <>
    //                         Connect <br />
    //                         Wallet
    //                       </>
    //                     ) : (
    //                       <>
    //                         Connected <br />
    //                         {userWalletId}
    //                       </>
    //                     )}
    //                   </div>
    //                 </CSSTransition>
    //               </SwitchTransition>
    //             </div>
    //           </button>
    //         </div>
    //       ) : (
    //         <Hamburger
    //           label='Show menu'
    //           rounded
    //           color='#464646'
    //           size={27}
    //           toggled={isMobileNavbarMenuToogled}
    //           toggle={setIsMobileNavbarMenuExpanded}
    //         />
    //       )
    //     }
    //   </div>
    //   {isMobileSmall && (
    //     <div
    //       className={mobileNavbarExpandedMenuClassnames}
    //       ref={expandedMenuRef}
    //     >
    //       <Link onClick={closeNavbar} to='/'>
    //         Mint NFT
    //       </Link>
    //       <Link onClick={closeNavbar} to='/my-nft-collection'>
    //         My NFT Collection
    //       </Link>
    //       <button onClick={handleShowModal}>
    //           {connectedWalletType === ConnectionStateType.NOCONNECTION ? (
    //             'Connect Wallet'
    //           ) : (
    //             `Connected ${ userWalletId }`
    //           )}
    //       </button>
    //     </div>
    //   )}
    // </header>
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
        <NavBarLink>
          <a onClick={handleShowModal}>
            {connectedWalletType === ConnectionStateType.NOCONNECTION ? (
              'Connect'
            ) : (
              `Connected ${userWalletId}`
            )}
          </a>
        </NavBarLink>
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
  a {
    font-size: 20px;
    color: #99FFAF;
    text-decoration: none;

    cursor: pointer;
  }
`

export default Header;
