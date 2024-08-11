import { type BaseError, useReadContracts } from "wagmi";

import { abi_nft, address_nft } from "@/app/contract_data/CryptoCanvasToken";

export default function ReadContract() {
  const wagmiContractConfig = {
    abi: abi_nft,
    address: address_nft,
  };
  const { data, error, isPending } = useReadContracts({
    contracts: [
      {
        ...wagmiContractConfig,
        functionName: "balanceOf",
        args: ["0x03A71968491d55603FFe1b11A9e23eF013f75bCF"],
      },
      {
        ...wagmiContractConfig,
        functionName: "owner",
      },
      {
        ...wagmiContractConfig,
        functionName: "totalSupply",
      },
    ],
  });
  console.log(data);
  console.log(error);
  console.log(isPending);
  const [balance, ownerOf, totalSupply] = data || [];

  if (isPending) return <div>Loading...</div>;

  if (error)
    return (
      <div>Error: {(error as BaseError).shortMessage || error.message}</div>
    );

  return (
    <>
      <div>Balance: {balance?.toString()}</div>
      <div>Owner of Token 69: {ownerOf?.toString()}</div>
      <div>Total Supply: {totalSupply?.toString()}</div>
    </>
  );
}
