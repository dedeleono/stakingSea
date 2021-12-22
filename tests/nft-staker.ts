import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { NftStaker } from "../target/types/nft_staker";
import * as assert from "assert";

describe("nft-staker", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.NftStaker as Program<NftStaker>;
  const jollyranch = anchor.web3.Keypair.generate();
  it("JollyRanch Created!", async () => {
    await program.rpc.initialize({
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
    assert.equal(jollyAccount.amount, new anchor.BN(0));
    assert.equal(jollyAccount.amountRedeemed, new anchor.BN(0));
  });
});
