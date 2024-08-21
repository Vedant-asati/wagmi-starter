"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseUnits, formatEther } from "viem";

// MUI
import {
  Grid,
  Button,
  TextField,
  Typography,
  Container,
  Box,
} from "@mui/material";

// Internal
import {
  abi_marketplace,
  address_marketplace,
} from "@/contract_data/NFT_Marketplace";
import { abi_nft, address_nft } from "@/contract_data/CryptoCanvasToken";
import { Listing } from "@/types/Listing";
import Header from "@/app/components/Header";

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
  const [price, setPrice] = useState<string>("");

  // Read Contract
  const { data: nft } = useReadContract({
    address: address_marketplace,
    abi: abi_marketplace,
    functionName: "address_TokenId_ListingMap",
    args: [address_nft, BigInt(id)],
  });

  // Write Contract
  const { writeContractAsync } = useWriteContract();

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

  useEffect(() => {
    if (!nftData) return;

    const now = Math.floor(Date.now() / 1000);
    setIsExpired(now > (nftData?.auctionWindow || 1e12));
    setStatus(
      nftData?.sold
        ? "Sold"
        : now > (nftData?.auctionWindow || 1e12)
          ? "Expired"
          : "On Sale"
    );

    if (nftData?.listingTime) {
      setListingDate(
        new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
          timeZoneName: "shortOffset",
        }).format(new Date(Number(nftData?.listingTime) * 1000))
      );
    }

    if (nftData?.auctionWindow) {
      setAuctionEnd(
        new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
          timeZoneName: "shortOffset",
        }).format(new Date(Number(nftData?.auctionWindow) * 1000))
      );
    }
  }, [nftData]);

  useEffect(() => {
    if (address) {
      setIsOwner(
        nftData?.seller?.toLowerCase() === address?.toLowerCase() &&
          address !== "0x0"
      );
      setIsArbiter(
        nftData?.arbiter?.toLowerCase() === address?.toLowerCase() &&
          address !== "0x0"
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
      console.log("NFT Bought Successfully.");
    } catch (error) {
      console.log("Error buying NFT: ", error);
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
      console.log("NFT cancelled successfully.");
    } catch (error) {
      console.log("Error cancelling NFT: ", error);
    }
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setPrice(inputValue);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Header />
      {nftData ? (
        <>
          <Typography variant="h4" gutterBottom>{`NFT ${id}`}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Price:</strong> {formatEther(nftData.price)} ETH
                </Typography>
                <Typography variant="body1">
                  <strong>Seller:</strong>{" "}
                  {`${nftData.seller.slice(0, 6)}...${nftData.seller.slice(-4)}`}
                </Typography>
                <Typography variant="body1">
                  <strong>Buyer:</strong>{" "}
                  {nftData.buyer
                    ? `${nftData.buyer.slice(0, 6)}...${nftData.buyer.slice(-4)}`
                    : "None"}
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong> {status}
                </Typography>
                <Typography variant="body1">
                  <strong>Listing Date:</strong> {listingDate.toUpperCase()}
                </Typography>
                <Typography variant="body1">
                  <strong>Auction End:</strong> {auctionEnd.toUpperCase()}
                </Typography>
              </Box>

              {isOwner && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Arbiter:</strong>{" "}
                    {`${nftData.arbiter.slice(0, 6)}...${nftData.arbiter.slice(-4)}`}
                    <Box component="span" sx={{ fontStyle: "italic", ml: 1 }}>
                      Owned by you
                    </Box>
                  </Typography>
                </Box>
              )}

              {(isArbiter || isOwner) && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Refund to Buyer"
                    value={price}
                    onChange={handlePriceChange}
                    fullWidth
                    margin="normal"
                  />
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={cancelListing}
                    disabled={isExpired}
                    sx={{ mt: 2 }}
                  >
                    Cancel Listing
                  </Button>
                </Box>
              )}

              {!isOwner && !isArbiter && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Enter Price (ETH)"
                    value={price}
                    onChange={handlePriceChange}
                    type="number"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={buyNFT}
                    disabled={isExpired || nftData?.sold}
                  >
                    Buy NFT
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <img
                src={`/api/pinata/${nftData?.uri}`}
                alt={`NFT ${id}`}
                style={{ width: "100%", borderRadius: "8px" }}
              />
            </Grid>
          </Grid>
        </>
      ) : (
        <Typography variant="h5" gutterBottom>
          Loading NFT data...
        </Typography>
      )}
    </Container>
  );
}
