import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { FormikValues } from 'formik';
import { toast } from 'react-toastify';
import { TokenId } from '@hashgraph/sdk';
import axios from 'axios';

import HTS, { NewTokenType } from '@services/HTS';
import IPFS, { UploadResponse } from '@services/IPFS';
import useHederaWallets from '@utils/hooks/useHederaWallets';
import { HomepageContext } from '@utils/context/HomepageContext';
import filterFormValuesToNFTMetadata from '@utils/helpers/filterFormValuesToNFTMetadata';
import { MintTypes } from '@utils/entity/MinterWizard'
import { NFTMetadata } from '@utils/entity/NFT-Metadata';
import Header from '@components/shared/layout/Header';
import { HederaWalletsContext } from '@src/utils/context/HederaWalletsContext';

import { BsSend } from 'react-icons/bs';

import { AppContext } from '@src/utils/context/context';

import { styled } from 'styled-components';

import { BACKEND_BASEURL } from '@src/utils/constant/constant';
import { Client, AccountBalanceQuery, TransferTransaction } from '@hashgraph/sdk';

const META_KEYS = [
  'name',
  'creator',
  'creatorDID',
  'description',
  'image',
  'type',
  'format',
  'attributes',
  'properties',
  'files',
  'localization',
];

export default function MinterWizard() {

  const AppData = useContext(AppContext);

  const { userWalletId, sendTransaction } = useHederaWallets();
  const { mintedNFTData, setNewNFTdata, tokenCreated, resetHomepageData } = useContext(HomepageContext);

  const uploadNFTFile = useCallback(async (file) => {
    const { data } = await IPFS.uploadFile(file);

    return data;
  }, []);

  const uploadMetadata = useCallback(async (metadata) => {
    const orderedMetadata: { [key: string]: any } = {};

    for (const key of META_KEYS) {
      if (metadata[key]) {
        orderedMetadata[key] = metadata[key];
      }
    }

    const { data } = await IPFS.createMetadataFile(orderedMetadata as NFTMetadata);

    return data;
  }, []);

  const createToken = useCallback(async (values: NewTokenType): Promise<TokenId | null> => {
    const createTokenTx = await HTS.createToken(values);
    const createTokenResponse = await sendTransaction(createTokenTx, true);

    if (!createTokenResponse) {
      throw new Error('Create Token Error.');
    }

    return createTokenResponse.tokenId;
  }, [sendTransaction]);

  const mint = useCallback(async (tokenId: string, cids: string[]) => {
    if (!userWalletId) {
      throw new Error('Error with loading logged account data!');
    }
    const tokenMintTx = HTS.mintToken(tokenId, userWalletId, cids);

    const tokenMintResponse = await sendTransaction(tokenMintTx);

    if (!tokenMintResponse) {
      throw new Error('Token mint failed.');
    }

    return tokenMintResponse;
  }, [userWalletId, sendTransaction]);

  const renderMintingError = useCallback((e) => {
    if (typeof e === 'string') {
      toast.error(e);
    } else if (e instanceof Error) {
      if (e.message.includes('illegal buffer')) {
        toast.error('Transaction aborted in wallet.')
      }
      if (e.message.includes('INSUFFICIENT_PAYER_BALANCE')) {
        toast.error('No available balance to finish operation.')
      }
      else {
        toast.error(e.message)
      }
    }
  }, [])

  const handleFormSubmit = useCallback(async (values) => {
    const formValues: FormikValues = { ...values }
    const tokenSymbol = formValues.symbol;

    delete formValues.symbol;
    let formTokenId = formValues?.token_id
    let metaCIDs: UploadResponse[] = []

    try {
      if (!userWalletId) {
        throw new Error('First connect your wallet!');
      }

      if (
        formValues.mint_type === MintTypes.NewCollectionNewNFT
        || formValues.mint_type === MintTypes.ExistingCollectionNewNFT
      ) {
        const filteredValues = filterFormValuesToNFTMetadata(formValues);

        //upload image
        if (formValues.image) {
          const imageData = await uploadNFTFile(formValues.image);

          if (!imageData.ok) {
            throw new Error('Error when uploading NFT File!');
          }
          filteredValues.type = formValues.image.type;
          filteredValues.image = `ipfs://${imageData.value.cid}`;
        }

        // upload metadata
        const uploadedMetadata = await uploadMetadata(filteredValues)

        // copy uploaded metadata CID to have same length as minting NFT qty
        metaCIDs = Array.from(new Array(parseInt(formValues.qty))).map(() =>
          uploadedMetadata
        )
      } else {
        // if semi-NFT, use metadata from formik formValues
        metaCIDs = await Promise.all(
          Array.from(new Array(parseInt(formValues.qty))).map(() =>
            IPFS.createMetadataFile(formValues.serial_metadata)
              .then(res => res.data)
          )
        );
      }

      if (!formTokenId) {
        formTokenId = await createToken({
          tokenSymbol,
          accountId: userWalletId,
          tokenName: formValues.name,
          amount: formValues.qty,
          keys: [...formValues.keys, ...formValues.treasuryAccountId],
          customFees: formValues.fees,
          maxSupply: formValues.maxSupply
        } as NewTokenType);
      }

      if (!formTokenId) {
        throw new Error('Error! Problem with creating token!');
      }

      //check if is string
      const tokenIdToMint = formTokenId.toString();

      // mint
      await mint(
        tokenIdToMint,
        metaCIDs.map(({ value }) => value.cid)
      );

      setNewNFTdata({ ...formValues, tokenId: tokenIdToMint })
    } catch (e) {
      renderMintingError(e)
    }
  }, [
    createToken,
    mint,
    renderMintingError,
    setNewNFTdata,
    uploadMetadata,
    uploadNFTFile,
    userWalletId
  ]);

  useEffect(() => {
    resetHomepageData()
  }, [resetHomepageData])

  type ArrayObject<T> = {
    [key: string]: Array<T>;
  }
  const [content, setContent] = useState< ArrayObject<any>>({});
  const [selChat, setSelChat] = useState<string>('');
  const [newChat, setNewChat] = useState<string>('');

  const chatDivRef = useRef(null);

  useEffect(() => {
    (async () => {
      let result: any = await axios.get(BACKEND_BASEURL + '/nft/getall');
      result = result.data;

      if (result.ok && AppData.selectedNFTData) {
        let tmp: ArrayObject<any> = {};
        for (let i = 0; i < result.result.length; i++) {
          if (result.result[i].nftid != AppData.selectedNFTData.edition) {
            // tmp.push(result.result[i].nftid);
            tmp[result.result[i].nftid] = [];
          }
        }

        let result1 = await axios.get(BACKEND_BASEURL+"/chat/getall/"+AppData.selectedNFTData.edition);

        // result1.data.sort((a: any, b: any) => { return a.createAt - b.createAt});

        for (let i = 0; i < result1.data.result.length; i++) {
          const other = AppData.selectedNFTData.edition.toString() === result1.data.result[i].fromid ? result1.data.result[i].toid : result1.data.result[i].fromid;

          if (Object.keys(tmp).indexOf(other) === -1) {
            tmp[other] = [];
            tmp[other].push(result1.data.result[i]);
          } else {
            tmp[other].push(result1.data.result[i]);
          }
        }

        console.log("tmp: ", tmp);

        setContent(tmp);
      }
    })()
  }, [AppData.selectedNFTData, AppData.renderFlag])


  useEffect(() => {
    (async () => {
      if (userWalletId && AppData.selectedNFTData) {
        
      }
    })()
  }, [AppData.selectedNFTData])

  const {
    hashConnect,
    hashConnectState,
  } = useContext(HederaWalletsContext);

  

  async function sendMessage() {
    
    if (userWalletId) {
      const tokenId = AppData.FTContract;
      const accountId1 = userWalletId;
      const accountId2 = '0.0.1229586';
  
      const provider = hashConnect?.getProvider("mainnet", hashConnectState.topic || '', accountId1);
  
      if (provider) {
        const signer = hashConnect?.getSigner(provider);
        
        if (signer) {
          let trans = await new TransferTransaction()
            .addTokenTransfer(tokenId, accountId1, -1)
            .addTokenTransfer(tokenId, accountId2, 1)
            .freezeWithSigner(signer);

          let res = await trans.executeWithSigner(signer);

          let result = await axios.post(BACKEND_BASEURL + "/chat/new", {
            fromid: AppData.selectedNFTData.edition.toString(),
            toid: selChat,
            content: newChat,
            ischecked: false,
          })
          result = result.data;
          if (result.ok) {
            AppData.setRenderFlag(AppData.renderFlag + 1);
            setNewChat('');
            const { scrollHeight, clientHeight } = chatDivRef.current;
            chatDivRef.current.scrollTop = scrollHeight - clientHeight;
          } else {
            toast.error('Message sender function error');
          }
        }
      }
    } else {
      toast.warning('Connect wallet first.')
    }
  }
  
  useEffect(() => {
    if (selChat !== '') {
      const { scrollHeight, clientHeight } = chatDivRef.current;
      chatDivRef.current.scrollTop = scrollHeight - clientHeight;

      (async () => {
          try {
            let result = await axios.post(BACKEND_BASEURL + "/chat/update/", {
            fromid: selChat,
            toid: AppData.selectedNFTData.edition.toString()
          });
          result = result.data;

          if (result.ok) {
            console.log(result.result);
            AppData.setRenderFlag(AppData.renderFlag + 1);
          } else {
            toast('Server error!')
          }
        } catch (e) {
          console.log("Server error", e);
          toast('Server error');
        }
        
      })()
    }
  }, [selChat])

  // useEffect(() => {
  //   (async () => {
  //     const tokenId = AppData.FTContract;
  //     const accountId1 = '0.0.3239335';
  //     const accountId2 = '0.0.1229586';
  
  //     const provider = hashConnect?.getProvider("mainnet", hashConnectState.topic || '', accountId1);
  
  //     if (provider) {
  //       const signer = hashConnect?.getSigner(provider);
        
  
  //       if (signer) {
  //           let trans = await new TransferTransaction()
  //           .addTokenTransfer(tokenId, accountId1, -1)
  //           .addTokenTransfer(tokenId, accountId2, 1)
  //           .freezeWithSigner(signer);
  //       }
  //     }
  //   })()
  // }, [])
 

  return (
    <HomePageWrapper>
      <Header />
      <ChatroomWrapper>
        <LeftDiv>
          <ChatDiv ref={chatDivRef}>
            {
              selChat !== '' && userWalletId ?
                content[selChat].map((item, index) => (
                  <>
                    {
                      item.toid === AppData.selectedNFTData.edition.toString() ? (
                        <MsgCome key={index}>
                          <p>
                            {item.content}
                          </p>
                        </MsgCome>
                      ): (
                        <MsgTo key={index}>
                          <p>
                            {item.content}
                          </p>
                        </MsgTo>
                      )
                    }
                  </>
                )) : undefined
            }
          </ChatDiv>
          <InputDiv>
            <input placeholder='Type your message here' value={newChat} onChange={(e) => {
              setNewChat(e.target.value);
            }} onKeyPress={async (e) => {
              e.charCode === 13 && await sendMessage()
            }}></input>
            <BsSend></BsSend>
          </InputDiv>
        </LeftDiv>
        <RightDiv>
          {
            userWalletId && 
            Object.keys(content).map((item, index) => (
              <Users key={index} onClick={() => setSelChat(item)} flag={item === selChat}>
                <img src={'https://ipfs.io/ipfs/bafybeihr6a63264l4jiep4rqdfq4zgwu4jnwvzp2g2a57e7rsivp5zorzu/'+ item +'.png'}></img>
                <p>#{item}</p>

                {
                  content[item].filter(item => !item.ischecked && item.toid === AppData.selectedNFTData.edition.toString()).length > 0 ? (
                    <span>
                      {
                        content[item].filter(item => !item.ischecked && item.toid === AppData.selectedNFTData.edition.toString()).length
                      }
                    </span>
                  ): undefined
                }
              </Users>
            ))
          }
        </RightDiv>
      </ChatroomWrapper>
    </HomePageWrapper>
  )
}


const HomePageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
`

const LeftDiv = styled.div`
  width: 80vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  position: relative;
`

const RightDiv = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  max-width: 100%;
  min-height: 100%;
  color: white;
  overflow: scroll;
  border-left: 3px solid #99FFAF;
  margin-left: 5px;
  padding-left: 5px;
  

  ::-webkit-scrollbar {
    width: 10px !important;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1 !important; 
  }
  
  ::-webkit-scrollbar-thumb {
    background: #888 !important; 
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555 !important;
  }
`

const ChatDiv = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  overflow: scroll;

  ::-webkit-scrollbar {
    width: 10px !important;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1 !important; 
  }
  
  ::-webkit-scrollbar-thumb {
    background: #888 !important; 
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555 !important;
  }
`

const MsgCome = styled.div`
  display: flex;
  width: 100%;
  p {
    border-radius: 10px;
    background: #272727;
    max-width: 50%;
    width: min-content;
    margin: 20px;
  
    color: #FFF;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    padding: 20px;
  }
`

                  
const MsgTo = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  p {
    border-radius: 10px;
    background: #036825;
    max-width: 50%;
    margin: 20px;
    float: right;
  
    color: #FFF;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    padding: 20px;
  }
`

const InputDiv = styled.div`
  border-radius: 10px;
  height: 65px;  
  background: #282828;
  margin: 10px 5px;
  width: 90%;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  padding: 10px 30px;

  input {
    background: #3C3C3C;
    color: white;

    border: 0;
    outline: 0;
  }

  svg {
    color: #99FFAF;
    cursor: pointer;
  }
`

const ChatroomWrapper = styled.div`
  display: flex;
  overflow: scroll;
  flex: 1;
`

const Users = styled.div<{
  flag: boolean
}>`
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  align-items: center;
  cursor: pointer;

  position: relative;

  span {
    position: absolute;

    width: 20px;
    height: 20px;

    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;

    top: 10px;
    left: 50px;

    background: #99FFAF;
    color: #141414;
    font-size: 15px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;

    border-radius: 50px;
  }

  &:hover {
    background: #282828;
  }

  background: ${p => p.flag ? '#282828' : ''};
  padding-left: 30px;
  margin: 5px 0;
  padding: 5px;

  img {
    width: 60px;
    height: 60px;
    border-radius: 50px;
  }

  p {
    color: #99FFAF;
  }
`