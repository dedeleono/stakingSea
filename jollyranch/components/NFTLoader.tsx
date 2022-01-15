import { FC, useState } from "react";
import { isSetIterator } from "util/types";

interface NFTLoaderProps {
  nft: NFT;
  isStaked: boolean;
  onStake?: any;
  onRedeem?: any;
  unStake?: any;
  stakingRewards?: any;
}
interface NFT {
  id: number;
  attributes: any;
  image: string;
  name: string;
  mint: any;
  nft_account: any;
}

const NFTLoader: FC<NFTLoaderProps> = ({
  nft,
  isStaked,
  onStake,
  onRedeem,
  unStake,
  stakingRewards,
}) => {
  // console.log("nftloader ran?");
  const [lockup, setLockup] = useState(1);

  if (isStaked) {
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
          <img src={`${nft.image}`} alt="sea shanties nft image" />
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
          <p className="mb-3"></p>
          <div className="">
            <p>Estimate Rewards</p>
            <p className="badge badge-outline bg-primary badge-sm text-xs">
              {stakingRewards[nft.nft_account.id.toString()] > -1
                ? stakingRewards[nft.nft_account.id.toString()] + " $TRTN"
                : "Loading..."}
            </p>
          </div>
          <div className="justify-center card-actions">
            <button className="btn btn-secondary" onClick={onRedeem}>
              redeem
            </button>
            {canWithdraw && (
              <button className="btn btn-ghost" onClick={unStake}>
                unstake
              </button>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // console.log("nft", nft);
    return (
      <div
        key={nft.id.toString() || Math.random()}
        className="card w-72 m-4 card-bordered card-compact lg:card-normal shadow-xl bg-primary-content text"
      >
        <figure>
          <img src={`${nft.image}`} alt="sea shainties nft image" />
        </figure>
        <div className="card-body">
          <h2 className="card-title">{nft.name}</h2>
          <button className="btn btn-primary mt-4" onClick={onStake}>
            Stake
          </button>
        </div>
      </div>
    );
  }
};

export default NFTLoader;
