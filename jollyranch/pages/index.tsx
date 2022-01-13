import * as anchor from "@project-serum/anchor";
import { Program, Provider, BN } from "@project-serum/anchor";
import { ConfirmOptions } from "@solana/web3.js";
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

import { useRouter } from "next/router";

import { programs } from "@metaplex/js";
const {
  metadata: { Metadata },
} = programs;

type jollyProgramState = {
  program: any;
  connection: any;
  jollyranch: any;
  jollyBump: any;
  recieverSplAccount: any;
  spl_token: any;
  splBump: any;
  wallet_token_account: any;
  jollyAccount: any;
};

const Home: NextPage = () => {
  const router = useRouter();
  const refreshData = () => router.replace(router.asPath);
  const wallet = useWallet();
  const [isLoading, nfts]: any = useWalletNfts();
  const [jollyState, setJollyState] = useState({} as jollyProgramState);
  const [stakedNFTs, setStakedNFTs] = useState([]);
  const [stakedMints, setStakedMints] = useState([]);
  const [loadingStakes, setLoadingStakes] = useState(true);
  const [stakingRewards, setStakingRewards] = useState({});
  const [refreshStateCounter, setRefreshStateCounter] = useState(0);
  const [totalRatsStaked, setTotaRatsStaked] = useState(0);

  const idl = idl_type as anchor.Idl;

  const stakeNFT = async (publicKey, cheese, lockup) => {
    const nft = new anchor.web3.PublicKey(publicKey);
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
        authority: wallet.publicKey.toString(),
        stake: stake.publicKey.toString(),
        jollyranch: jollyState.jollyranch.toString(),
        senderSplAccount: wallet_nft_account.toString(),
        recieverSplAccount: stake_spl.toString(),
        mint: nft.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
      },
      signers: [stake],
    });

    // console.log(
    //   "sender nft ending balance: ",
    //   await jollyState.program.provider.connection.getTokenAccountBalance(
    //     wallet_nft_account
    //   )
    // );
    // // second time just return all my stakes
    // const stakedNfts = await getStakedNfts();
    // console.log("stakedNfts after staking one:", stakedNfts);
    // setStakedNFTs(stakedNfts);
    // stakedNfts.map((stake, index) => {
    //   console.log("stake:", index);
    //   console.log(
    //     "stake.account.startDate",
    //     new Date(stake.account.startDate.toNumber() * 1000)
    //   );
    //   console.log(
    //     "stake.account.endDate",
    //     new Date(stake.account.endDate.toNumber() * 1000)
    //   );
    //   console.log(
    //     "stake.account.amountRedeemed",
    //     stake.account.amountRedeemed.toString()
    //   );
    //   console.log(
    //     "stake.account.amountOwed",
    //     stake.account.amountOwed.toString()
    //   );
    // });
  };

  const setupJollyRanch = async () => {
    const opts = {
      preflightCommitment: "recent" as ConfirmOptions,
    };
    let endpoint = JSON.parse(
      process.env.NEXT_PUBLIC_QUICKNODE_MAINNET_BETA_RPC_ENDPOINT
    );
    endpoint = endpoint[Math.floor(Math.random() * endpoint.length)];
    const network = endpoint;
    const connection = new anchor.web3.Connection(
      network,
      opts.preflightCommitment
    );

    const provider = new Provider(connection, wallet, opts.preflightCommitment);
    const ratbastards = new anchor.web3.PublicKey(
      "2sKvVnq3rwQRay5WNDHhsMNEpNQAJ4G9o8JTN5WjUpxo"
    );
    // console.log("ratbastards", ratbastards);
    // console.log("ratbastards", ratbastards.toString());
    const program = new Program(idl, ratbastards.toString(), provider);
    // console.log("program got ran", program);
    // default behavior new jollyranch each test

    // const jollyranch = anchor.web3.Keypair.generate();
    // switch to pda account for same jollyranch testing

    // console.log("program", program);

    // console.log("program", program.programId.toString());

    // pda generation example
    let [jollyranch, jollyBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("jolly_account")],
        program.programId
      );

    // console.log("jollyranch", jollyranch.toBase58());
    // console.log("jollyBump", jollyBump);

    // use your own token here ex CHEESE
    const spl_token = new anchor.web3.PublicKey(
      "3oePHsi4fhoyuLAjqXEgBUPB1cs4bP9A8cZpc1dATS9c"
    );

    const [recieverSplAccount, splBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [jollyranch.toBuffer()],
        program.programId
      );
    // console.log("recieverSplAccount", recieverSplAccount.toBase58());
    // console.log("splBump", splBump);

    // console.log("wallet", wallet);
    // console.log("wallet pulbic key", wallet.publicKey.toString());

    let wallet_token_account = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      spl_token,
      wallet.publicKey
    );
    // console.log("wallet_token_account", wallet_token_account.toBase58());

    const jollyAccount = await program.account.jollyRanch.fetch(
      jollyranch.toString()
    );
    // console.log("jollyAccount", jollyAccount);
    // console.log("jollyAccount.amount", jollyAccount.amount.toString());
    // console.log(
    //   "jollyAccount.amountRedeemed",
    //   jollyAccount.amountRedeemed.toString()
    // );
    // console.log("program", program);
    // console.log("jollyAccount", jollyAccount);
    // console.log("jollyAccount amount", jollyAccount.amount.toNumber());
    // console.log(
    //   "jollyAccount amount redeemed",
    //   jollyAccount.amountRedeemed.toNumber()
    // );
    setJollyState({
      program,
      connection,
      jollyranch,
      jollyBump,
      recieverSplAccount,
      spl_token,
      splBump,
      wallet_token_account,
      jollyAccount,
    });
  };

  const getNftData = async (nft_public_key) => {
    const tokenAccount = new anchor.web3.PublicKey(nft_public_key);
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
    const accountInfo: any = await jollyState.connection.getParsedAccountInfo(
      pda
    );

    const metadata: any = new Metadata(
      wallet.publicKey.toString(),
      accountInfo.value
    );
    const { data }: any = await axios.get(metadata.data.data.uri);
    return data;
  };

  const getStakedNfts = async () => {
    // console.log("jollyState program", jollyState.program);
    const newStakedNFTs = await jollyState.program.account.stake.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: bs58.encode(wallet.publicKey.toBuffer()),
        },
      },
    ]);
    // console.log("ran getStakedNfts", newStakedNFTs);
    setStakedNFTs(newStakedNFTs);
    // console.log("stakedNfts on load:", stakedNfts);
    // return stakedNfts;
  };

  const getStakedMints = async () => {
    // console.log("running getStakedMints with these nft accounts:", stakedNFTs);
    let allStakedMints = [];
    Promise.all(
      stakedNFTs.map(async (nft_account, i) => {
        // console.log("nft_account", nft_account);
        let [stake_spl, _stakeBump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [nft_account.publicKey.toBuffer()],
            jollyState.program.programId
          );
        // console.log("stake_spl", stake_spl);
        // console.log("stake_spl", stake_spl.toString());

        let endpoint = JSON.parse(
          process.env.NEXT_PUBLIC_QUICKNODE_MAINNET_BETA_RPC_ENDPOINT
        );
        endpoint = endpoint[Math.floor(Math.random() * endpoint.length)];

        const nft_public_key = await axios
          .post(endpoint, {
            jsonrpc: "2.0",
            id: 1,
            method: "getAccountInfo",
            params: [
              stake_spl.toString(),
              {
                encoding: "jsonParsed",
              },
            ],
          })
          .then(async (res) => {
            // console.log("res", res);
            // console.log(
            //   "res-mint",
            //   res.data.result.value.data.parsed.info.mint
            // );
            // console.log("returned res data in getStakedMints");
            return res.data.result.value?.data.parsed.info.mint;
          });

        // console.log("nft_public_key", nft_public_key);
        let nft = await getNftData(nft_public_key);
        nft["nft_account"] = nft_account;
        nft["nft_account"].id = i;
        // console.log("running pushed nft to mints", nft);
        allStakedMints.push(nft);
      })
    ).then(() => {
      // console.log("setStakedMints", allStakedMints);
      allStakedMints.map((nft) => {
        let percentage =
          (new Date().getTime() / 1000 -
            parseInt(nft.nft_account.account.startDate)) /
          (parseInt(nft.nft_account.account.endDate) -
            parseInt(nft.nft_account.account.startDate));
        let estimateRewards =
          nft.nft_account.account.amountOwed.toNumber() * percentage -
          nft.nft_account.account.amountRedeemed.toNumber();
        stakingRewards[nft.nft_account.id.toString()] =
          estimateRewards.toFixed(4);
      });
      setStakingRewards({ ...stakingRewards });
      // setInterval(() => {
      //   allStakedMints.map((nft) => {
      //     let percentage =
      //       (new Date().getTime() / 1000 -
      //         parseInt(nft.nft_account.account.startDate)) /
      //       (parseInt(nft.nft_account.account.endDate) -
      //         parseInt(nft.nft_account.account.startDate));
      //     let estimateRewards =
      //       nft.nft_account.account.amountOwed.toNumber() * percentage -
      //       nft.nft_account.account.amountRedeemed.toNumber();
      //     stakingRewards[nft.nft_account.id.toString()] =
      //       estimateRewards.toFixed(4);
      //   });
      //   setStakingRewards({ ...stakingRewards });
      // }, 3000);

      setLoadingStakes(false);
      setStakedMints(allStakedMints);
    });
  };

  const redeemRewards = async (nftPubKey) => {
    // console.log(
    //   "sender token starting balance: ",
    //   await jollyState.program.provider.connection.getTokenAccountBalance(
    //     jollyState.wallet_token_account
    //   )
    // );
    // get staked nfts
    // const stakedNfts = await jollyState.program.account.stake.all([
    //   {
    //     memcmp: {
    //       offset: 8, // Discriminator
    //       bytes: bs58.encode(
    //         jollyState.program.provider.wallet.publicKey.toBuffer()
    //       ),
    //     },
    //   },
    // ]);

    await jollyState.program.rpc.redeemRewards({
      accounts: {
        stake: nftPubKey.toString(),
        jollyranch: jollyState.jollyranch.toString(),
        authority: jollyState.program.provider.wallet.publicKey.toString(),
        senderSplAccount: jollyState.recieverSplAccount.toString(),
        recieverSplAccount: jollyState.wallet_token_account.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
      },
    });
    // console.log(
    //   "sender token ending balance: ",
    //   await jollyState.program.provider.connection.getTokenAccountBalance(
    //     jollyState.wallet_token_account
    //   )
    // );
  };

  const redeemNFT = async (nftPubKey) => {
    let wallet_nft_account = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nftPubKey,
      jollyState.program.provider.wallet.publicKey
    );
    // console.log(
    //   "sender nft starting balance: ",
    //   await jollyState.program.provider.connection.getTokenAccountBalance(
    //     wallet_nft_account
    //   )
    // );
    // get staked nfts
    // const stakedNfts = await jollyState.program.account.stake.all([
    //   {
    //     memcmp: {
    //       offset: 8, // Discriminator
    //       bytes: bs58.encode(
    //         jollyState.program.provider.wallet.publicKey.toBuffer()
    //       ),
    //     },
    //   },
    // ]);

    // console.log("stakedNfts", stakedNfts);

    let [stake_spl, _stakeBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [nftPubKey.toBuffer()],
        jollyState.program.programId
      );

    await jollyState.program.rpc.redeemNft({
      accounts: {
        stake: nftPubKey.toString(),
        jollyranch: jollyState.jollyranch.toString(),
        authority: jollyState.program.provider.wallet.publicKey.toString(),
        senderSplAccount: stake_spl.toString(),
        recieverSplAccount: wallet_nft_account.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
      },
    });
    // console.log(
    //   "sender nft ending balance: ",
    //   await jollyState.program.provider.connection.getTokenAccountBalance(
    //     wallet_nft_account
    //   )
    // );
  };

  const getTotalStakedRats = async () => {
    const total = await jollyState.program.account.stake.all();
    setTotaRatsStaked(total.length);
  };

  useEffect(() => {
    // console.log("intervals cleared");
    let highestTimeoutId = setTimeout(";");
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    if (wallet.publicKey) {
      setupJollyRanch();
    }
  }, [wallet, refreshStateCounter]);

  useEffect(() => {
    // console.log("react nft state changed");
    if (jollyState["program"]) {
      getStakedNfts();
      getTotalStakedRats();
    }
  }, [jollyState]);

  useEffect(() => {
    if (stakedNFTs.length > 0) {
      setLoadingStakes(true);
      getStakedMints();
    } else {
      setLoadingStakes(false);
    }
  }, [stakedNFTs]);

  return (
    <>
      <Head>
        <title>Cheese Factory</title>
        <meta
          name="description"
          content="An nft staking platform for Rat Bastards"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="grid grid-cols-1 min-h-screen bg-neutral-focus text-neutral-content p-16">
          <div className="text-center col-span-1">
            <div className="grid-cols-3">
              {/* Navbar Section */}
              <div className="navbar mb-8 shadow-lg bg-neutral text-neutral-content rounded-box">
                <div className="px-2 mx-2 navbar-start">
                  <span className="text-lg font-bold">Cheese Factory</span>
                </div>
                <div className="hidden px-2 mx-2 navbar-center sm:flex">
                  <div className="flex items-stretch">
                    {wallet.publicKey && (
                      <div className="w-full mt-2 border stats border-base-300 m-2.5">
                        <div className="stat">
                          <div className="stat-value">
                            {totalRatsStaked.toLocaleString("en-US")}/3,369
                          </div>
                          <div className="stat-title">Rats Staked</div>
                          <div className="stat-desc">
                            <progress
                              value={`${totalRatsStaked}`}
                              max="3369"
                              className="progress progress-secondary"
                            ></progress>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="navbar-end">
                  <div className="btn btn-primary">
                    <WalletMultiButton
                      style={{
                        all: "unset",
                        height: "100%",
                        width: "100%",
                        zIndex: "10",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="border mockup-window border-base-300 mb-8">
                {/* begin app windows */}
                <div className="flex justify-center px-4 py-16 border-t border-base-300">
                  {loadingStakes && wallet.connected && (
                    <h1 className="text-lg font-bold animate-pulse">
                      Loading your Staked NFT&apos;s, please wait...
                    </h1>
                  )}
                  {!wallet.connected && <p>please connect your wallet above</p>}
                  {stakedMints.length > 0 && !loadingStakes && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {stakedMints.map((nft, i) => {
                        // console.log("id", i);
                        // console.log("nft", nft);
                        // console.log(
                        //   "nft.nft_account.account.amountOwed.toNumber()",
                        //   nft.nft_account.account.amountOwed.toNumber()
                        // );
                        const canWithdraw =
                          Math.round(new Date().getTime() / 1000) -
                            nft.nft_account.account.endDate >=
                          0;
                        return (
                          <div
                            key={nft.nft_account.id.toString() || Math.random()}
                            className="card w-72 m-4 card-bordered card-compact shadow-xl bg-primary-content text"
                          >
                            <figure>
                              <img
                                src={`${nft.image}`}
                                alt="rat bastard nft image"
                              />
                            </figure>
                            <div className="card-body text-center items-center">
                              <h2 className="card-title">{nft.name}</h2>
                              <p>Started</p>
                              <p className="badge badge-outline bg-ghost badge-sm text-white">
                                {new Date(
                                  nft.nft_account.account.startDate * 1000
                                ).toLocaleDateString("en-US", {
                                  weekday: "short", // long, short, narrow
                                  day: "numeric", // numeric, 2-digit
                                  year: "numeric", // numeric, 2-digit
                                  month: "short", // numeric, 2-digit, long, short, narrow
                                  hour: "numeric", // numeric, 2-digit
                                  minute: "numeric", // numeric, 2-digit
                                })}
                              </p>
                              <p>Ends</p>
                              <p className="badge badge-outline bg-ghost badge-sm text-white">
                                {new Date(
                                  nft.nft_account.account.endDate * 1000
                                ).toLocaleDateString("en-US", {
                                  weekday: "short", // long, short, narrow
                                  day: "numeric", // numeric, 2-digit
                                  year: "numeric", // numeric, 2-digit
                                  month: "short", // numeric, 2-digit, long, short, narrow
                                  hour: "numeric", // numeric, 2-digit
                                  minute: "numeric", // numeric, 2-digit
                                })}
                              </p>
                              <p className="mb-3"></p>
                              <div className="">
                                <p>Estimate Rewards</p>
                                <p className="badge badge-outline bg-primary">
                                  {stakingRewards[
                                    nft.nft_account.id.toString()
                                  ] > -1
                                    ? (
                                        stakingRewards[
                                          nft.nft_account.id.toString()
                                        ] / 1000
                                      ).toFixed(4) + " $CHEEZE"
                                    : "Loading..."}
                                </p>
                              </div>
                              <div className="justify-center card-actions">
                                <button
                                  className="btn btn-secondary"
                                  onClick={async () => {
                                    await redeemRewards(
                                      nft.nft_account.publicKey
                                    );
                                    setRefreshStateCounter(
                                      refreshStateCounter + 1
                                    );
                                  }}
                                >
                                  redeem
                                </button>
                                {canWithdraw && (
                                  <button
                                    className="btn btn-ghost"
                                    onClick={async () => {
                                      await redeemNFT(
                                        nft.nft_account.publicKey
                                      );
                                      setRefreshStateCounter(
                                        refreshStateCounter + 1
                                      );
                                    }}
                                  >
                                    unstake
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {stakedMints.length == 0 &&
                    !loadingStakes &&
                    wallet.publicKey && (
                      <p className="text-lg font-bold">
                        You don't have any ratbastards staked.
                      </p>
                    )}
                </div>
              </div>

              <div className="border mockup-window border-base-300 mb-8">
                <div className="flex justify-center px-4 py-16 border-t border-base-300">
                  <div>
                    {isLoading && (
                      <h1 className="text-lg font-bold animate-pulse">
                        Loading your NFT&apos;s, please wait...
                      </h1>
                    )}
                    {!isLoading && !wallet.connected && (
                      <p>please connect your wallet above</p>
                    )}
                    {!isLoading && wallet.connected && nfts.length === 0 && (
                      <h1 className="text-lg font-bold">
                        You don't have any ratbastards in your wallet.
                      </h1>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3">
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
                          key={nft.id.toString() || Math.random()}
                          className="card w-72 m-4 card-bordered card-compact lg:card-normal shadow-xl bg-primary-content text"
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
                                name={`options ${nft.id.toString()}`}
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
                                name={`options ${nft.id.toString()}`}
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
                                name={`options ${nft.id.toString()}`}
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
                                setRefreshStateCounter(refreshStateCounter + 1);
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
