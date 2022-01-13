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
          <img src={`${nft.image}`} alt="rat bastard nft image" />
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
            <p className="badge badge-outline bg-primary badge-sm text-xs">
              {stakingRewards[nft.nft_account.id.toString()] > -1
                ? stakingRewards[nft.nft_account.id.toString()] / 1000 +
                  " $CHEEZE"
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
    let cheese_index;
    nft.attributes.map((cheese: any, index: number) => {
      if (cheese.trait_type === "Cheeserank") {
        cheese_index = index;
      }
    });
    let cheese;

    if (nft.attributes[cheese_index].value === "1cheeze") {
      cheese = 1;
    } else if (nft.attributes[cheese_index].value === "2cheeze") {
      cheese = 2;
    } else if (nft.attributes[cheese_index].value === "3cheeze") {
      cheese = 3;
    }
    return (
      <div
        key={nft.id.toString() || Math.random()}
        className="card w-72 m-4 card-bordered card-compact lg:card-normal shadow-xl bg-primary-content text"
      >
        <figure>
          <img src={`${nft.image}`} alt="rat bastard nft image" />
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
                setLockup(1);
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
                setLockup(2);
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
                setLockup(3);
                e.target.checked = true;
              }}
              className="btn bg-neutral-focus"
            />
          </div>
          <button
            className="btn btn-primary mt-4"
            onClick={onStake.bind(this, cheese, lockup)}
          >
            Stake
          </button>
        </div>
      </div>
    );
  }
};

export default NFTLoader;
