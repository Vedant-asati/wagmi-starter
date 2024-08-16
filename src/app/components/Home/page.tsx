"use client";
import React, { useEffect, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import Link from "next/link";

// MUI
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
} from "@mui/material";

// Internal
import {
  abi_marketplace,
  address_marketplace,
} from "@/contract_data/NFT_Marketplace";
import { type Listing } from "@/types/Listing";

export default function Home() {
  const [nftListings, setNftListings] = useState<Listing[]>([]);
  const [dataArr, setDataArr] = useState([]);
  const [doIt, setDoIt] = useState(false);

  // Read
  const { data: listingsLength, isFetched: lengthFetched } = useReadContract({
    address: address_marketplace,
    abi: abi_marketplace,
    functionName: "getListingsLength",
  });

  const {
    data: listings,
    isFetched: listingsFetched,
    isFetching,
  } = useReadContracts({
    contracts: dataArr,
  });

  useEffect(() => {
    // TODO- Resolve extra call on return from /nft/[id]
    if (!lengthFetched) return;
    const aggrData = [];
    for (let i = 0; i < listingsLength; i++) {
      aggrData.push({
        address: address_marketplace,
        abi: abi_marketplace,
        functionName: "listings",
        args: [i],
      });
    }
    setDataArr(aggrData);
    console.log("JSR! Done.");
    console.log(listingsLength);
  }, [listingsLength]);

  useEffect(() => {
    if (!listings || !listingsLength) return;
    console.log("listings: ", listings);
    console.log("listingsLength: ", listingsLength);
    const filteredListings = listings.filter(
      (elem) => elem.result[0] !== "0x0000000000000000000000000000000000000000"
    );

    const formattedListings: Listing[] = filteredListings.map((e) => ({
      tokenId: e.result[8],
      seller: e.result[0],
      buyer: e.result[1],
      arbiter: e.result[2],
      price: BigInt(e.result[3]),
      listingTime: e.result[4],
      auctionWindow: e.result[5], // Auction Expiry time in sec
      sold: e.result[6],
      uri: e.result[7],
    }));

    setNftListings(formattedListings);
  }, [listings, listingsLength]);

  useEffect(() => {
    if (!nftListings) return;
    console.log("JSR! NFTListings: ", nftListings);
  }, [nftListings]);

  return (
    <>
      JSR HOME
      <button onClick={() => setDoIt(!doIt)}>DoIt</button>
      <Grid container spacing={3} sx={{ padding: 3 }}>
        {nftListings.map((listing) => {
          const isExpired =
            Math.floor(Date.now() / 1000) > listing.auctionWindow;
          const status = listing.sold
            ? "Sold"
            : isExpired
              ? "Expired"
              : "In Sale";
          return (
            <Grid item xs={12} sm={6} md={4} key={listing.tokenId}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  // TODO: Fix this
                  image={`/api/pinata/${listing.uri}`}
                  alt={`NFT ${listing.tokenId}`}
                />
                <CardContent>
                  <Typography variant="h6">NFT #{listing.tokenId}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Price: {listing.price} ETH
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Seller: {listing.seller.slice(0, 6)}...
                    {listing.seller.slice(-4)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {status}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Listed on:{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                      timeZoneName: "shortOffset",
                    }).format(new Date(Number(listing?.listingTime) * 1000))}
                  </Typography>
                  <Link href={`/nft/${listing.tokenId}`} passHref>
                    <Button variant="contained" color="primary" fullWidth>
                      View NFT
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
