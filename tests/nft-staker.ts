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
  const jollyranch = anchor.web3.Keypair.generate();
  // use your own token here ex CHEESE
  const spl_token = new PublicKey(
    "9JtgcKbtYsxbrc715Dq6Z7zm5XS5vZr55Bav8vwDpARb"
  );

  const [recieverSplAccount, jollyranch_bump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [jollyranch.publicKey.toBuffer()],
      program.programId
    );
  console.log("recieverSplAccount", recieverSplAccount.toBase58());
  console.log("jollyranch_bump", jollyranch_bump);

  let wallet_token_account = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    spl_token,
    program.provider.wallet.publicKey
  );
  console.log("wallet_token_account", wallet_token_account.toBase58());

  it("JollyRanch Created!", async () => {
    await program.rpc.initialize(spl_token, {
      accounts: {
        jollyranch: jollyranch.publicKey,
        authority: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [jollyranch],
    });
    const jollyAccount = await program.account.jollyRanch.fetch(
      jollyranch.publicKey
    );
    // console.log("jollyAccount", jollyAccount);
    assert.equal(
      jollyAccount.authority.toBase58(),
      program.provider.wallet.publicKey.toBase58()
    );
    assert.equal(jollyAccount.amount.toString(), new anchor.BN(0).toString());
    assert.equal(
      jollyAccount.amountRedeemed.toString(),
      new anchor.BN(0).toString()
    );
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

    let amount = new anchor.BN(10);
    await program.rpc.fundRanch(jollyranch_bump, amount, {
      accounts: {
        jollyranch: jollyranch.publicKey,
        authority: program.provider.wallet.publicKey,
        senderSplAccount: wallet_token_account,
        recieverSplAccount: recieverSplAccount,
        mint: spl_token,
        tokenProgram: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
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
