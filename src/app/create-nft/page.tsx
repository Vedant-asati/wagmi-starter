"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
// import { useSelector } from "react-redux";
// import { Link, useHistory } from "react-router-dom";
import Link from "next/link";
import { PinataSDK } from "pinata";
import {
  type BaseError,
  useAccount,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";
import { parseUnits } from "viem";

// MUI
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
// import { DatePicker } from "@nextui-org/react";

import { classes } from "./styles.js";

// Internal
import DropZone from "../components/DropZone/index";
// import { api } from "../../services/api";
import { abi_nft, address_nft } from "@/app/contract_data/CryptoCanvasToken";
import {
  abi_marketplace,
  address_marketplace,
} from "@/app/contract_data/NFT_Marketplace";
import ReadContract from "./ReadContract";
import { dateToSeconds } from "@/app/utils";

const CreateNFT = () => {
  // const history = useHistory();

  // const account = useSelector((state) => state.allNft.account);
  // const artTokenContract = useSelector(
  //   (state) => state.allNft.artTokenContract
  // );

  const { address } = useAccount();
  const {
    data: hash,
    error,
    isPending,
    writeContract,
    writeContractAsync,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Event Logs
  useWatchContractEvent({
    address: address_nft,
    abi: abi_nft,
    args: {
      to: address,
    },
    chainId: 11155111,
    eventName: "NFT_Mint",
    onLogs(logs) {
      console.log("JSR! New NFT Minted!", logs[0].args);
      setTokenId(Number(logs[0].args.tokenId));
    },
    onError(error) {
      console.log("JSR! Error from NFT_Mint log: ", error);
    },
  });
  useWatchContractEvent({
    address: address_marketplace,
    abi: abi_marketplace,
    args: {
      seller: address,
    },
    chainId: 11155111,
    eventName: "NFTListed",
    onLogs(logs) {
      console.log("JSR! New NFTListed!", logs[0]);
    },
    onError(error) {
      console.log("JSR! Error from NFTListed log: ", error);
    },
  });

  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT
      ? process.env.NEXT_PUBLIC_PINATA_JWT
      : "",
    pinataGateway: "turquoise-voluntary-cricket-828.mypinata.cloud",
  });

  const [_tokenId, setTokenId] = useState<number>(-1);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tokenId: "",
    arbiter: "",
    auction_window: "",
    price: "",
  });

  // 1 TODO: Fix calling twice
  useEffect(() => {
    if (isConfirmed && _tokenId !== -1 && !isApproved) {
      (async () => {
        // Safely list NFT on Marketplace
        await approveMarketplace(_tokenId);
        setIsApproved(true);
      })();
    }
  }, [isConfirmed, _tokenId]);

  // 2
  useEffect(() => {
    if (isConfirmed && _tokenId !== -1 && isApproved) {
      (async () => {
        // Safely list NFT on Marketplace
        await listNFT(_tokenId);
        setTokenId(-1);
        setIsApproved(false);
        // await uploadJsonToIPFS();
      })();
    }
  }, [isConfirmed, _tokenId, isApproved]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  }

  async function uploadImageToPinata() {
    if (selectedFile) {
      try {
        const file = new File([selectedFile], selectedFile.name, {
          type: selectedFile.type,
        });

        console.log("JSR! Uploading image...");
        const res = await pinata.upload.file(file);
        console.log("Pinata res: ", res);

        const ImgURL = `https://gateway.pinata.cloud/ipfs/${res.IpfsHash}`;
        console.log("ImgURL", ImgURL);

        return res.IpfsHash;
      } catch (error) {
        console.log("JSR! Error uploading image to IPFS");
        console.log(error);
      }
    } else {
      console.log("JSR! Please select a file to upload");
    }
  }

  async function safeMint(receiver: `0x${string}`, PinataCID: string) {
    try {
      await writeContractAsync({
        address: address_nft,
        abi: abi_nft,
        functionName: "safeMint",
        args: [receiver, PinataCID],
      });
      console.log("JSR NFT Minted");
    } catch (error) {
      console.log(error);
    }
  }

  async function approveMarketplace(tokenId: number) {
    try {
      await writeContractAsync({
        address: address_nft,
        abi: abi_nft,
        functionName: "approve",
        args: [address_marketplace, BigInt(tokenId)],
      });
      console.log("JSR NFT Approved");
    } catch (error) {
      console.log(error);
    }
  }

  async function listNFT(tokenId: number) {
    const { title, description, price, arbiter, auction_window } = formData;
    const auctionWindowInSeconds = dateToSeconds(auction_window);
    console.log("Marketplace: ", address_marketplace);
    console.log(
      " Marketplace Params: ",
      address_nft,
      tokenId,
      price,
      arbiter,
      auctionWindowInSeconds
    );

    try {
      await writeContractAsync({
        address: address_marketplace,
        abi: abi_marketplace,
        functionName: "listNFT",
        args: [
          address_nft,
          tokenId,
          parseUnits(price, 18),
          arbiter,
          auctionWindowInSeconds,
        ],
      });
      console.log("Yay! NFT Listed Successfully 🎉🎉");
      console.log("Txn hash: ", hash);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleCreateNFT(event: FormEvent) {
    event.preventDefault();

    // Upload Image to Pinata
    const PinataCID = await uploadImageToPinata();
    console.log("User Address: ", address);
    console.log("PinataCID: ", PinataCID);
    if (!address || !PinataCID)
      return console.error("JSR Address or PinataCID is undefined.");

    // Safely mint NFT
    await safeMint(address, PinataCID);
    // Now event will be triggered which will trigger listNFT function

    // Safely list NFT on Marketplace
    // await listNFT(_tokenId); -- Now In useEffect

    // Create json data to upload to IPFS
    // await uploadJsonToIPFS(PinataCID);
  }
  // const uploadJsonToIPFS = async (PinataCID: string) => {
  //   const { title, description } = formData;

  //   const data = new FormData();
  //   data.append("name", title);
  //   data.append("description", description);
  //   data.append("pinata-cid", PinataCID);

  //   const plainData: Record<string, string> = {};
  //   data.forEach((value, key) => {
  //     plainData[key] = value as string;
  //   });

  //   const jsonBlob = new Blob([JSON.stringify(plainData)], {
  //     type: "application/json",
  //   });
  //   const file = new File([jsonBlob], "CryptoCanvasData.json");

  //   // Upload State data to IPFS
  //   try {
  //     console.log("Please wait updating state...");
  //     const res = await pinata.upload.file(file);
  //     console.log("Cool! State updated on IPFS.");
  //     console.log("Pinata res: ", res);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  return (
    <div style={classes.pageCreateNft}>
      <form onSubmit={handleCreateNFT}>
        <div style={classes.formHeader}>
          <h1>Create collectible</h1>
          <Link href="/">
            <CancelOutlinedIcon fontSize="large" />
          </Link>
        </div>
        <div style={classes.content}>
          <div style={classes.dropzone}>
            <DropZone onFileUploaded={setSelectedFile} />
          </div>
          <fieldset>
            <TextField
              label="Title"
              name="title"
              variant="filled"
              required
              value={formData.title}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              variant="filled"
              required
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Token Id"
              name="tokenId"
              variant="filled"
              required
              value={formData.tokenId}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Arbiter"
              name="arbiter"
              variant="filled"
              required
              value={formData.arbiter}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="price"
              name="price"
              variant="filled"
              value={formData.price}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">ETH</InputAdornment>
                ),
              }}
              fullWidth
            />
            <label htmlFor="auction_window">Auction End:</label>
            <input
              type="date"
              id="auction_window"
              name="auction_window"
              onChange={handleInputChange}
              value={formData.auction_window}
            />
            <br />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={isPending || isConfirming}
            >
              {isPending || isConfirming ? "Confirming..." : "Create"}
            </Button>
          </fieldset>
        </div>
      </form>
      {/* <form onSubmit={safeMint}>
        <input name="token-receiver" placeholder="0xA0Cf...251e" required />
        <input name="pinata-cid" placeholder="QmXs...i1g" required />
        <button disabled={isPending} type="submit">
          {isPending ? "Confirming..." : "Mint"}
        </button>
        {hash && <div>Transaction Hash: {hash}</div>}
        {isConfirming && <div>Waiting for confirmation...</div>}
        {isConfirmed && <div>Transaction confirmed.</div>}
        {error && (
          <div>Error: {(error as BaseError).shortMessage || error.message}</div>
        )}
      </form> */}
    </div>
  );
};

export default CreateNFT;
