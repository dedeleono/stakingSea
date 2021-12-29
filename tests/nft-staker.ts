import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { NftStaker } from "../target/types/nft_staker";
import * as assert from "assert";
import { PublicKey } from "@solana/web3.js";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("nft-staker", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  // @ts-ignore
  const program = anchor.workspace.NftStaker as Program<NftStaker>;
  // default behavior new jollyranch each test

  // const jollyranch = anchor.web3.Keypair.generate();
  // switch to pda account for same jollyranch testing

  // pda generation example
  let [jollyranch, jollyBump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("jolly_account")],
    program.programId
  );

  console.log("jollyranch", jollyranch.toBase58());
  console.log("jollyBump", jollyBump);

  // use your own token here ex CHEESE
  const spl_token = new PublicKey(
    "BHK3mS5iqAu5E2yAyAofYf57GTSF3pbiKLJzwkmZAURy"
  );

  const [recieverSplAccount, splBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [jollyranch.toBuffer()],
      program.programId
    );
  console.log("recieverSplAccount", recieverSplAccount.toBase58());
  console.log("splBump", splBump);

  let wallet_token_account = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    spl_token,
    program.provider.wallet.publicKey
  );
  console.log("wallet_token_account", wallet_token_account.toBase58());

  let jollyAccount;

  it("JollyRanch Created!", async () => {
    // only run this if it's the first time you're running the test
    // await program.rpc.initialize(jollyBump, splBump, {
    //   accounts: {
    //     jollyranch: jollyranch,
    //     authority: program.provider.wallet.publicKey,
    //     recieverSplAccount: recieverSplAccount,
    //     mint: spl_token,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //   },
    // });
    jollyAccount = await program.account.jollyRanch.fetch(jollyranch);
    console.log("jollyAccount", jollyAccount);
    assert.equal(
      jollyAccount.authority.toBase58(),
      program.provider.wallet.publicKey.toBase58()
    );
    // assert.equal(jollyAccount.amount.toString(), new anchor.BN(0).toString());
    // assert.equal(
    //   jollyAccount.amountRedeemed.toString(),
    //   new anchor.BN(0).toString()
    // );
  });
  // fund the ranch
  it("JollyRanch Funded", async () => {
    console.log(
      "sender token starting balance: ",
      await program.provider.connection.getTokenAccountBalance(
        wallet_token_account
      )
    );
    // console.log(
    //   "receiver token balance: ",
    //   await program.provider.connection.getTokenAccountBalance(
    //     recieverSplAccount
    //   )
    // );

    let amount = new anchor.BN(1e9);
    await program.rpc.fundRanch(amount, {
      accounts: {
        jollyranch: jollyranch,
        authority: program.provider.wallet.publicKey,
        senderSplAccount: wallet_token_account,
        recieverSplAccount: recieverSplAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });
    console.log(
      "sender token ending balance: ",
      await program.provider.connection.getTokenAccountBalance(
        wallet_token_account
      )
    );
    console.log(
      "receiver token balance: ",
      await program.provider.connection.getTokenAccountBalance(
        recieverSplAccount
      )
    );
  });
});
