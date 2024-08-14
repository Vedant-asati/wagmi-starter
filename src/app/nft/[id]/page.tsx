"use client";
import React, { useState, useEffect } from "react";
import InputEvent from "react";
import Link from "next/link";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseUnits, formatEther } from "viem";

// MUI
import { Grid, Button, TextField, Typography } from "@mui/material";

// Internal
import {
  abi_marketplace,
  address_marketplace,
} from "@/app/contract_data/NFT_Marketplace";
import { abi_nft, address_nft } from "@/app/contract_data/CryptoCanvasToken";
import { type Listing } from "@/app/types/Listing";
import { classes } from "./styles";

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  const { address } = useAccount();

  const [nftData, setNftData] = useState<Listing | null>(null);

  const [isOwner, setIsOwner] = useState(false);
  const [isArbiter, setIsArbiter] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const [status, setStatus] = useState("");
  const [listingDate, setListingDate] = useState("");
  const [auctionEnd, setAuctionEnd] = useState("");
  const [price, setPrice] = useState<string | null>(null);

  // Read
  const {
    data: nft,
    isLoading: isLoadingNFT,
    isFetched,
  } = useReadContract({
    address: address_marketplace,
    abi: abi_marketplace,
    functionName: "address_TokenId_ListingMap",
    args: [address_nft, BigInt(id)],
  });

  // Write
  const {
    data: hash,
    error,
    isPending,
    writeContract,
    writeContractAsync,
  } = useWriteContract();

  // 1
  useEffect(() => {
    if (!nft) return;

    // TODO: Fix types
    setNftData({
      tokenId: Number(id),
      price: BigInt(nft[3]),
      seller: nft[0],
      buyer: nft[1],
      arbiter: nft[2],
      listingTime: nft[4],
      auctionWindow: nft[5], // Auction Expiry time in sec
      sold: nft[6],
      uri: nft[7],
    });
  }, [nft]);

  // 2
  useEffect(() => {
    if (!nftData) return;

    setIsExpired(
      Math.floor(Date.now() / 1000) > (nftData?.auctionWindow || 1e12)
    );
    setStatus(
      nftData?.sold
        ? "Sold"
        : Math.floor(Date.now() / 1000) > (nftData?.auctionWindow || 1e12)
          ? "Expired"
          : "On Sale"
    );
    if (nftData?.listingTime) {
      const formattedDate = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZoneName: "shortOffset",
      }).format(new Date(Number(nftData?.listingTime) * 1000));
      setListingDate(formattedDate.toLocaleUpperCase());
    }
    if (nftData?.auctionWindow) {
      const formattedDate = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZoneName: "shortOffset",
      }).format(new Date(Number(nftData?.auctionWindow) * 1000));
      setAuctionEnd(formattedDate.toLocaleUpperCase());
    }
  }, [nftData]);

  // 3
  useEffect(() => {
    if (address) {
      setIsOwner(
        nftData?.seller?.toLowerCase() === address?.toLowerCase() &&
          address != "0x0"
      );
      setIsArbiter(
        nftData?.arbiter?.toLowerCase() === address?.toLowerCase() &&
          address != "0x0"
      );
    }
  }, [address, nftData]);

  const buyNFT = async () => {
    try {
      if (!price) return;
      await writeContractAsync({
        address: address_marketplace,
        abi: abi_marketplace,
        functionName: "offerToBuy",
        args: [address_nft, id],
        value: parseUnits(price, 18),
      });
      console.log("JSR! NFT Bought Successfully.");
    } catch (error) {
      console.log("JSR! Error with buying NFT: ", error);
    }
  };

  const cancelListing = async () => {
    try {
      if (!price) return;
      await writeContractAsync({
        address: address_marketplace,
        abi: abi_marketplace,
        functionName: "cancelListing",
        args: [address_nft, id],
        value: parseUnits(price, 18),
      });
      console.log("JSR! NFT cancelled Successfully.");
    } catch (error) {
      console.log("JSR! Error with cancelling NFT: ", error);
    }
  };

  // TODO Fix type
  const handleChange = (e) => {
    setPrice(e.target.value);
  };

  if (isLoadingNFT || !nftData) return <div>Loading...</div>;

  return (
    <>
      <Link href="/">
        {/* <a style={{ textDecoration: "none", marginBottom: "16px" }}> */}← Go
        to Homepage
        {/* </a> */}
      </Link>
      {/* "is Fetched: "{isFetched ? "true" : "false"}
      <br />
      "is Arbiter: "{isArbiter ? "true" : "false"}
      <br />
      "is Owner: "{isOwner ? "true" : "false"}
      <br />
      "is Expired: "{isExpired ? "true" : "false"}
      <br />
      "is Sold: "{nftData?.sold ? "true" : "false"} */}

      <Grid container spacing={3} sx={{ padding: 3 }}>
        <Grid item xs={12} sm={6}>
          <img
            src={`/api/pinata/${nftData?.uri}`}
            alt={nftData?.tokenId?.toString()}
            style={{ width: "100%", borderRadius: "8px" }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="h4">#{nftData?.tokenId}</Typography>
          <TextField
            label="Owner"
            value={`${nftData?.seller?.slice(0, 6)}...${nftData?.seller?.slice(-4)}`}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField
            label="Description"
            value={nftData?.tokenId}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField
            label="Price"
            value={`${formatEther(nftData?.price)} ETH`}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField
            label="Status"
            value={status}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField
            label="Listing Time"
            value={listingDate}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField
            label="Auction End"
            value={auctionEnd}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: true,
            }}
          />
          {!nftData?.sold && !isOwner && !isArbiter && !isExpired && (
            <TextField
              label="Bid Price"
              value={price}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          )}
          {isArbiter && !isExpired && (
            <TextField
              label="Refund to Buyer"
              value={price}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          )}
          {isOwner && (
            <>
              <TextField
                label="Arbiter"
                value={nftData?.arbiter}
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
              <TextField
                value="Owned by you"
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
            </>
          )}

          {isArbiter && !isExpired && (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => cancelListing()}
            >
              Cancel Listing
            </Button>
          )}

          {!isOwner && !isArbiter && !nftData?.sold && !isExpired && (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => buyNFT()}
            >
              Buy NFT
            </Button>
          )}
        </Grid>
      </Grid>
    </>
  );
}
