import * as anchor from "@project-serum/anchor";
import { Program, Provider, BN } from "@project-serum/anchor";
import { IDL, NftStaker } from "../lib/types/nft_staker";
import * as assert from "assert";
import { Commitment, ConfirmOptions, PublicKey } from "@solana/web3.js";
import * as bs58 from "bs58";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import type { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import useWalletNfts from "../hooks/useWalletNfts";

import idl_type from "../lib/nft_staker.json";

import axios from "axios";

import { programs } from "@metaplex/js";
const {
  metadata: { Metadata },
} = programs;

type jollyProgramState = {
  program: any;
  jollyranch: any;
  jollyBump: any;
  recieverSplAccount: any;
  spl_token: any;
  splBump: any;
  wallet_token_account: any;
  jollyAccount: any;
};

const Home: NextPage = () => {
  const wallet = useWallet();
  const [isLoading, nfts]: any = useWalletNfts();
  const [jollyState, setJollyState] = useState({} as jollyProgramState);
  const [stakedNFTs, setStakedNFTs] = useState([]);

  const idl = idl_type as anchor.Idl;

  const stakeNFT = async (publicKey, cheese, lockup) => {
    const nft = new PublicKey(publicKey);
    // console.log("nft", nft.toString());
    // console.log("cheese", cheese);
    // console.log("lockup", lockup);
    const stake = anchor.web3.Keypair.generate();
    let [stake_spl, stakeBump] = await anchor.web3.PublicKey.findProgramAddress(
      [stake.publicKey.toBuffer()],
      jollyState.program.programId
    );
    let wallet_nft_account = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nft,
      wallet.publicKey
    );
    await jollyState.program.rpc.stakeNft(stakeBump, lockup, cheese, {
      accounts: {
        authority: wallet.publicKey,
        stake: stake.publicKey,
        jollyranch: jollyState.jollyranch,
        senderSplAccount: wallet_nft_account,
        recieverSplAccount: stake_spl,
        mint: nft,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [stake],
    });
    console.log(
      "sender nft ending balance: ",
      await jollyState.program.provider.connection.getTokenAccountBalance(
        wallet_nft_account
      )
    );
    // second time just return all my stakes
    const stakedNfts = await getStakedNfts();
    console.log("stakedNfts after staking one:", stakedNfts);
    setStakedNFTs(stakedNfts);
    stakedNfts.map((stake, index) => {
      console.log("stake:", index);
      console.log(
        "stake.account.startDate",
        new Date(stake.account.startDate.toNumber() * 1000)
      );
      console.log(
        "stake.account.endDate",
        new Date(stake.account.endDate.toNumber() * 1000)
      );
      console.log(
        "stake.account.amountRedeemed",
        stake.account.amountRedeemed.toString()
      );
      console.log(
        "stake.account.amountOwed",
        stake.account.amountOwed.toString()
      );
    });
  };

  const opts = {
    preflightCommitment: "recent" as ConfirmOptions,
  };

  const network = "https://solana-api.projectserum.com";
  const connection = new anchor.web3.Connection(
    network,
    opts.preflightCommitment
  );

  const provider = new Provider(connection, wallet, opts.preflightCommitment);

  const setupJollyRanch = async () => {
    // @ts-ignore
    const program: Program<NftStaker> = new Program(
      idl,
      "2sKvVnq3rwQRay5WNDHhsMNEpNQAJ4G9o8JTN5WjUpxo",
      provider
    );
    // default behavior new jollyranch each test

    // const jollyranch = anchor.web3.Keypair.generate();
    // switch to pda account for same jollyranch testing

    console.log("program", program);

    console.log("program", program.programId.toString());

    // pda generation example
    let [jollyranch, jollyBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("jolly_account")],
        program.programId
      );

    console.log("jollyranch", jollyranch.toBase58());
    console.log("jollyBump", jollyBump);

    // use your own token here ex CHEESE
    const spl_token = new PublicKey(
      "3oePHsi4fhoyuLAjqXEgBUPB1cs4bP9A8cZpc1dATS9c"
    );

    const [recieverSplAccount, splBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [jollyranch.toBuffer()],
        program.programId
      );
    console.log("recieverSplAccount", recieverSplAccount.toBase58());
    console.log("splBump", splBump);

    console.log("wallet", wallet);
    console.log("wallet pulbic key", wallet.publicKey.toString());

    let wallet_token_account = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      spl_token,
      wallet.publicKey
    );
    console.log("wallet_token_account", wallet_token_account.toBase58());

    const jollyAccount = await program.account.jollyRanch.fetch(jollyranch);
    console.log("jollyAccount", jollyAccount);
    console.log("jollyAccount.amount", jollyAccount.amount.toString());
    console.log(
      "jollyAccount.amountRedeemed",
      jollyAccount.amountRedeemed.toString()
    );

    setJollyState({
      program,
      jollyranch,
      jollyBump,
      recieverSplAccount,
      spl_token,
      splBump,
      wallet_token_account,
      jollyAccount,
    });
  };

  const getStakedNfts = async () => {
    // console.log("jollyState program", jollyState.program);
    const stakedNfts = await jollyState.program.account.stake.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: bs58.encode(wallet.publicKey.toBuffer()),
        },
      },
    ]);
    setStakedNFTs(stakedNfts);
    console.log("stakedNfts on load:", stakedNfts);
    return stakedNfts;
  };

  useEffect(() => {
    if (wallet.publicKey) {
      setupJollyRanch();
    }
  }, [wallet]);

  useEffect(() => {
    if (jollyState.program) {
      getStakedNfts();
    }
  }, [jollyState]);

  const getNftData = async (nft_public_key) => {
    const tokenAccount = new PublicKey(nft_public_key);
    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );
    let [pda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        new anchor.web3.PublicKey(tokenAccount.toString()).toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    const accountInfo: any = await connection.getParsedAccountInfo(pda);

    const metadata: any = new Metadata(
      wallet.publicKey.toString(),
      accountInfo.value
    );
    const { data }: any = await axios.get(metadata.data.data.uri);
    return data;
  };

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
                  {stakedNFTs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-4">
                      {stakedNFTs.map(async (nft_account) => {
                        // console.log("nft_account", nft_account);
                        let [stake_spl, stakeBump] =
                          await anchor.web3.PublicKey.findProgramAddress(
                            [nft_account.publicKey.toBuffer()],
                            jollyState.program.programId
                          );
                        console.log("stake_spl", stake_spl.toString());
                        const nft_public_key = await axios
                          .post("https://api.mainnet-beta.solana.com", {
                            jsonrpc: "2.0",
                            id: 1,
                            method: "getAccountInfo",
                            params: [
                              "ALUNJwkxSiduENK9rV7koFZTV7HFsacMAcno1TZVAgfZ",
                              {
                                encoding: "jsonParsed",
                              },
                            ],
                          })
                          .then(async (res) => {
                            console.log("res", res);
                            return res["value"].data.parsed.mint;
                          });

                        console.log("nft_public_key", nft_public_key.data);
                        const nft = await getNftData(nft_public_key);
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p>No NFTs currently staked.</p>
                  )}
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
                        <WalletMultiButton
                          style={{
                            all: "unset",
                            height: "100%",
                            width: "100%",
                          }}
                        />
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
                      // console.log("nft", nft);
                      let lockup = 1;
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
                                defaultChecked
                                onChange={(e) => {
                                  lockup = 1;
                                  e.target.checked = true;
                                }}
                                className="btn bg-neutral-focus"
                              />
                              <input
                                type="radio"
                                name="options"
                                id="option2"
                                data-title="20"
                                onChange={(e) => {
                                  lockup = 2;
                                  e.target.checked = true;
                                }}
                                className="btn bg-neutral-focus"
                              />
                              <input
                                type="radio"
                                name="options"
                                id="option3"
                                data-title="30"
                                onChange={(e) => {
                                  lockup = 3;
                                  e.target.checked = true;
                                }}
                                className="btn bg-neutral-focus"
                              />
                            </div>
                            <button
                              className="btn btn-primary mt-4"
                              onClick={async () => {
                                await stakeNFT(nft.mint, cheese, lockup);
                              }}
                            >
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
