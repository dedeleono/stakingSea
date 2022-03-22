import {FC, useEffect, useState} from "react";
import Image from "next/image";

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
  const [image, setImage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if(nft.image.includes('ipfs.dweb.link')){
      // We need to transform https://xxx.ipfs.dweb.link to https://ipfs.io/ipfs/xxx
      const id = nft.image.split('//').pop().split('.')[0];
      const _image = `https://ipfs.io/ipfs/${id}?ext=jpg`;
      setImage(_image);
    } else {
      setImage(nft.image)
    }
  }, [nft.image]);
    return (
      <div
        className="card w-72 m-4 card-compact shadow-2xl bg-primary-content text"
      >
        <figure className="block aspect-video relative">
          {!imageLoaded && (
              <div className="animate-pulse card flex justify-center items-center card-compact bg-slate-800 absolute top-0 left-0 right-0 bottom-0 !w-auto rounded-b-none" >
                <div className="btn loading btn-circle btn-lg btn-ghost" />
              </div>)}
          {image && (
              <Image
                  className="object-cover"
                  quality={80}
                  src={image}
                  width={300}
                  height={100}
                  alt={nft.name}
                  layout="fill"
                  onLoadingComplete={() => setImageLoaded(true)}
              />
          )}
        </figure>
        {isStaked ? (
            <div className="card-body text-center items-center">
              <h2
                  className="card-title"
                  style={{ fontFamily: "Jangkuy", fontSize: "1.2rem" }}
              >
                {nft.name}
              </h2>
              <p style={{ fontFamily: "Montserrat", fontSize: "14px" }}>Started</p>
              <p
                  className="badge badge-outline bg-ghost badge-sm text-white"
                  style={{ fontFamily: "Montserrat", fontSize: "10px" }}
              >
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
                <p style={{ fontFamily: "Montserrat" }}>Estimate Rewards</p>
                <p
                    className="badge badge-outline badge-sm text-xs font-bold"
                    style={{ fontFamily: "Montserrat", color: "#f7752f" }}
                >
                  {stakingRewards[nft.nft_account.id.toString()] > -1
                      ? stakingRewards[nft.nft_account.id.toString()] + " $TRTN"
                      : "Loading..."}
                </p>
              </div>
              <div className="justify-center card-actions">
                <button
                    className="btn rounded-md btn-sm btn-secondary font-[Jangkuy] text-[0.8rem]"
                    onClick={onRedeem}
                >
                  redeem
                </button>
                <button
                    className="tn rounded-md btn-sm btn-accent font-[Jangkuy] text-[0.8rem]"
                    onClick={unStake}
                >
                  unstake
                </button>
              </div>
            </div>
        ) : (
            <div className="card-body">
              <h2
                  className="card-title"
                  style={{ fontFamily: "Jangkuy", fontSize: "1.2rem" }}
              >
                {nft.name}
              </h2>
              <button
                  className="btn btn-secondary badge-outline mt-4"
                  onClick={onStake}
                  style={{
                    fontFamily: "Scratchy",
                    fontSize: "1.3rem",
                    color: "#ffffff",
                    borderColor: "#3DB489",
                  }}
              >
                Stake
              </button>
            </div>
        )}

      </div>
    );
};

export default NFTLoader;
