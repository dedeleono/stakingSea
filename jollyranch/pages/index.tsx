import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
// import styles from '../styles/Home.module.css'

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import useWalletNfts from "../hooks/useWalletNfts";

import dynamic from "next/dynamic";
const WalletProviderSection = dynamic(
  () => import("../components/WalletProviderSection"),
  {
    ssr: false,
  }
);

const Home: NextPage = () => {
  const wallet = useWallet();
  const [isLoading, nfts]: any = useWalletNfts();
  return (
    <WalletProviderSection>
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
            <div className="max-w-md">
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
            </div>
          </div>
        </div>
      </main>
    </WalletProviderSection>
  );
};

export default Home;
