import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
// import styles from '../styles/Home.module.css'

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import useWalletNfts from "../hooks/useWalletNfts";

const Home: NextPage = () => {
  const wallet = useWallet();
  const [isLoading, nfts]: any = useWalletNfts();
  return (
    <>
      <Head>
        <title>Rat Bastards JollyRanch</title>
        <meta
          name="description"
          content="An nft staking platform for rat bastards"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="hero min-h-screen bg-neutral-focus text-neutral-content">
          <div className="text-center hero-content">
            <div className="max-w-6xl">
              {/* begin app windows */}
              <div className="border mockup-window border-base-300 m-8">
                <div className="flex justify-center px-4 py-16 border-t border-base-300">
                  <p>No NFTs currently staked.</p>
                </div>
              </div>

              <div className="border mockup-window border-base-300 m-8">
                <div className="flex justify-center px-4 py-16 border-t border-base-300">
                  <div>
                    {isLoading && (
                      <h1 className="text-lg font-bold animate-pulse">
                        Loading your NFT&apos;s, please wait...
                      </h1>
                    )}
                    {!isLoading && !wallet.connected && (
                      <div className="btn btn-primary">
                        <WalletMultiButton style={{ all: "unset" }} />
                      </div>
                    )}
                    {!isLoading && wallet.connected && nfts.length === 0 && (
                      <h1 className="text-lg font-bold">
                        You do not have &quot;NFTs&quot;
                      </h1>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4">
                    {nfts.map((nft) => {
                      console.log("nft", nft);
                      let cheese_index;
                      nft.attributes.map((cheese: any, index: number) => {
                        if (cheese.trait_type === "Cheeserank") {
                          cheese_index = index;
                        }
                      });
                      let cheese;

                      if (nft.attributes[cheese_index].value === "1cheeze") {
                        cheese = 1;
                      } else if (
                        nft.attributes[cheese_index].value === "2cheeze"
                      ) {
                        cheese = 2;
                      } else if (
                        nft.attributes[cheese_index].value === "3cheeze"
                      ) {
                        cheese = 3;
                      }
                      return (
                        <div
                          key={nft.id}
                          className="card w-72 card-bordered card-compact lg:card-normal shadow-xl bg-primary-content text"
                        >
                          <figure>
                            <img
                              src={`${nft.image}`}
                              alt="rat bastard nft image"
                            />
                          </figure>
                          <div className="card-body">
                            <h2 className="card-title">{nft.name}</h2>
                            <p>Cheese Rank: {cheese}</p>
                            <p className="pt-2">Lockup period(days)</p>
                            <div className="btn-group grid grid-cols-3 content-center">
                              <input
                                type="radio"
                                name="options"
                                id="option1"
                                data-title="10"
                                className="btn bg-neutral-focus"
                              />
                              <input
                                type="radio"
                                name="options"
                                id="option2"
                                data-title="20"
                                checked={true}
                                className="btn bg-neutral-focus"
                              />
                              <input
                                type="radio"
                                name="options"
                                id="option3"
                                data-title="30"
                                className="btn bg-neutral-focus"
                              />
                            </div>
                            <button className="btn btn-primary mt-4">
                              Stake
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* end app windows */}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
