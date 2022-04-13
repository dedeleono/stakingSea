import Head from "next/head";
import React, {useEffect, useState} from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {ToastContainer} from 'react-toastify';
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import NFTLoader from "../components/shared/NFTLoader";
import Navigation from "../components/Navigation";
import Bg from "../public/images/out.jpg";
import useShantiesStore from "../hooks/useShantiesStore";

const redeemAllChunk = 10;

export default function Home() {
  const wallet = useAnchorWallet();
  const initState = useShantiesStore((state) => state.initState);
  const stats = useShantiesStore((state) => state.stats);
  const stake = useShantiesStore((state) => state.stakeNFT);
  const unStake = useShantiesStore((state) => state.unStakeNFT);
  const redeemRewards = useShantiesStore((state) => state.redeemRewards);
  const redeemAllRewards = useShantiesStore((state) => state.redeemAllRewards);
  const [initLoading, setInitLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isRedeemingAll, setIsRedeemingAll] = useState(false);

  useEffect(() => {
    async function initStore() {
      setInitLoading(true);
      await initState(wallet, true);
      setInitLoading(false);
    }
    if (wallet?.publicKey) {
      setWalletConnected(true);
      initStore();
    } else {
      setWalletConnected(false);
    }
  }, [wallet]);

  return (
    <>
      <Head>
        <title>Shill City Capital</title>
        <meta
          name="description"
          content="An nft staking platform for Sea Shanties"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div
          style={{
            backgroundImage: `url(${Bg.src})`,
            backgroundAttachment: "fixed",
            objectFit: "contain",
            backgroundRepeat: "no-repeat",
            zIndex: "10",
            display: "absolute",
            backgroundSize: "cover",
          }}
          className="grid grid-cols-1 min-h-screen bg-neutral-focus text-neutral-content pt-16 p-2 md:p-16 bg-center"
        >
          <Navigation activeId="shill-city-capital" />
          <div className="text-center pt-8 md:pt-20 col-span-1 container mx-auto max-w-screen-xl">
            <div className="grid-cols-3">
              <div className="navbar mb-8 shadow-lg bg-neutral text-neutral-content rounded-box">
                <div className="px-2 mx-2 navbar-start">
                  <span className="text-lg font-bold font-jangkuy">
                    Shill City Capital
                  </span>
                </div>
                <div className="hidden px-2 mx-2 navbar-center sm:flex">
                  <div className="flex items-stretch">
                    {!!(walletConnected && stats?.totalStaked) && (
                      <div className="w-full mt-2  m-2.5">
                        <div className="stat bg-accent">
                          <div className="stat-value text-white">
                            {stats?.totalStaked.toLocaleString("en-US")}/3,333
                          </div>
                          <div
                            className="stat-title text-white"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            {((stats?.totalStaked/3333)*100).toFixed(2)}% Shanties Staked
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="navbar-end">
                <div className="mr-4 justify-center align-center">
                    {!wallet?.publicKey ? (
                        <div className="btn btn-primary z-50 text-white">
                        <WalletMultiButton
                            style={{
                              all: "unset",
                              height: "100%",
                              width: "100%",
                              zIndex: "10",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontFamily: "Montserrat",
                              fontSize: "0.8rem",
                            }}
                        />
                        </div>
                    ) : (
                        <>
                          {!!(stats?.stakedNfts && stats.stakedNfts.length > 1) && (
                              <button
                                  className={`btn h-full btn-secondary mt-4 font-jangkuy ${isRedeemingAll && 'loading'}`}
                                  onClick={async () => {
                                    setIsRedeemingAll(true);
                                    await redeemAllRewards(redeemAllChunk);
                                    setIsRedeemingAll(false);
                                  }}
                              >
                                Redeem All
                              </button>
                          )}
                          {!!(stats?.stakedNfts && stats.stakedNfts.length > redeemAllChunk) && (
                              <span className="text-[0.8rem] font-[Montserrat] font-sans leading-normal mt-2 block opacity-50">
                                {Math.ceil(stats.stakedNfts.length / redeemAllChunk)}{" "}
                                        transactions will be prompted
                              </span>
                          )}
                        </>
                    )}
                  </div>
                </div>
              </div>
              <div>
                {!!(stats?.unStakedNfts && !stats.unStakedNfts.length && stats?.stakedNfts && !stats.stakedNfts.length) && (
                    <div>
                      <div className="w-full flex justify-center justify-items-center text-center">
                        <div className="max-w-md">
                          <h1 className="text-4xl font-bold font-jangkuy">
                            You don&apos;t have any Shanties 😥
                          </h1>
                          <div className="mt-5 mb-8">
                            <a
                                href="https://magiceden.io/marketplace/sea_shanties"
                                rel="noreferrer noopener"
                                target="_blank"
                                className="btn btn-lg btn-secondary"
                            >
                              Buy on Magic Eden
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </div>
              {!!(stats?.stakedNfts && stats.stakedNfts.length > 0) && (
                  <div className="card gap-4 bg-neutral bg-opacity-60 mb-4 md:backdrop-blur-sm flex flex-row text-left p-8 justify-center items-center">
                    <div>
                      <div className="font-bold pb-2 text-[#feff04] font-[Scratchy] text-2xl">
                        COMING SOON…
                      </div>
                      <h2 className="font-jangkuy text-2xl  md:text-4xl py-2">
                        Get ready for<br/>Hotels and mortgage
                      </h2>
                      <div className="font-[900] opacity-60 max-w-3xl font-[Montserrat]">
                        A small collection of hotels will be released that can only be minted thru burning 4 Shanties + X $TRTN. Hotels will have locking periods, earn High rewards in $TRTN, deflationary mechanic for Shanties, and can be used as collateral for loans.
                      </div>
                    </div>
                    <div className="w-1/2 md:flex text-center hidden lg:block">
                      <img className="max-w-xs rounded-md inline shadow-lg" src="/images/hotels.png" />
                    </div>
                  </div>
              )}
              <div className="card bg-info bg-opacity-10 mb-8 md:backdrop-blur-sm">
                <div className="flex justify-center px-2 py-4 border-base-200">
                  {walletConnected ? (
                     <>
                       {initLoading ? (
                           <div className="font-scratchy text-white text-5xl animate-pulse">
                             Loading your shanties, please wait...
                           </div>
                       ) : (
                           <>
                             {stats?.stakedNfts && stats.stakedNfts.length > 0 ? (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                   {stats.stakedNfts.map((nft) => {
                                     return (
                                         <NFTLoader
                                             key={nft.id}
                                             nft={nft}
                                             onStake={stake}
                                             onRedeem={redeemRewards}
                                             unStake={unStake}
                                         />
                                     );
                                   })}
                                 </div>
                             ) : (
                                 <div className="font-scratchy text-white text-5xl">
                                   You don&apos;t have any shanties staked
                                 </div>
                             )}
                           </>
                       )}
                     </>
                  ) : (
                      <div className="font-scratchy text-white text-5xl">
                        Please connect your wallet above
                      </div>
                  )}
                </div>
              </div>
              {!!(walletConnected && stats?.unStakedNfts) && (
                  <div className="border mockup-window border-base-200 mb-8">
                    <div className="flex justify-center px-2 py-4 border-t border-base-200">
                      <div>
                        {!!(stats?.unStakedNfts && stats.unStakedNfts.length == 0 && wallet?.publicKey) && (
                            <div className="font-scratchy text-white text-5xl">
                              You don&apos;t have any shanties in your wallet
                            </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {!!stats?.unStakedNfts && stats.unStakedNfts.map((nft) => {
                          return (
                              <NFTLoader
                                  key={nft.id}
                                  nft={nft}
                                  onStake={stake}
                                  onRedeem={redeemRewards}
                                  unStake={unStake}
                              />
                          );
                        })}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
        <ToastContainer position="top-center" theme="dark"/>
      </main>
    </>
  );
}
