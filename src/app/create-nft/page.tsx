"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import {
  type BaseError,
  useAccount,
  useReadContract,
  useWatchContractEvent,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import toast, { Toaster } from "react-hot-toast";
import { PinataSDK } from "pinata";

// MUI
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

// Internal
import DropZone from "../components/DropZone/index";
import { abi_nft, address_nft } from "@/contract_data/CryptoCanvasToken";
import {
  abi_marketplace,
  address_marketplace,
} from "@/contract_data/NFT_Marketplace";
import { dateToSeconds, generateImage, urlToFile } from "@/utils/utils";
import Header from "../components/Header/index";

const CreateNFT = () => {
  const [_tokenId, setTokenId] = useState<number>(-1);
  const [URI, setURI] = useState<string>("");
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    arbiter: "",
    auction_window: "",
    price: "",
  });
  const [prompt, setPrompt] = useState<string | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  const { address, chainId } = useAccount();
  const { data: hash, writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const { data: url } = useReadContract({
    address: address_nft,
    abi: abi_nft,
    functionName: "tokenURI",
    args: [BigInt(_tokenId)],
  });

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
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT || "",
    pinataGateway:
      process.env.NEXT_PUBLIC_PINATA_NEXT_PUBLIC_PINATA_GATEWAY || "",
  });

  useEffect(() => {
    if (url) {
      const uri = url.split("/").pop();
      if (uri) setURI(uri);
    }
  }, [url]);

  useEffect(() => {
    if (isConfirmed && _tokenId !== -1 && !isApproved) {
      (async () => {
        await approveMarketplace(_tokenId);
        setIsApproved(true);
      })();
    }
  }, [isConfirmed, _tokenId]);

  useEffect(() => {
    if (isConfirmed && _tokenId !== -1 && isApproved) {
      (async () => {
        await listNFT(_tokenId, URI);
        setTokenId(-1);
        setIsApproved(false);
        // await uploadJsonToIPFS();
      })();
    }
  }, [isConfirmed, _tokenId, isApproved]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateImage = async () => {
    try {
      const url = await generateImage(prompt);
      setAiImageUrl(url);
      setSelectedFile(await urlToFile(url));
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  const uploadImageToPinata = async () => {
    if (selectedFile) {
      try {
        const file = new File([selectedFile], selectedFile.name, {
          type: selectedFile.type,
        });

        console.log("JSR! Uploading image...");
        const res = await pinata.upload.file(file);
        const ImgURL = `https://gateway.pinata.cloud/ipfs/${res.IpfsHash}`;

        setURI(res.IpfsHash);
        return res.IpfsHash;
      } catch (error) {
        console.error("Error uploading image to IPFS:", error);
      }
    } else {
      console.log("Please select a file to upload");
    }
  };

  const safeMint = async (receiver: `0x${string}`, PinataCID: string) => {
    try {
      await writeContractAsync({
        address: address_nft,
        abi: abi_nft,
        functionName: "safeMint",
        args: [receiver, PinataCID],
      });
      console.log("JSR NFT Minted");
    } catch (error) {
      console.error("Error minting NFT:", error);
    }
  };

  const approveMarketplace = async (tokenId: number) => {
    try {
      await writeContractAsync({
        address: address_nft,
        abi: abi_nft,
        functionName: "approve",
        args: [address_marketplace, BigInt(tokenId)],
      });
      console.log("JSR NFT Approved");
    } catch (error) {
      console.error("Error approving marketplace:", error);
    }
  };

  const listNFT = async (tokenId: number, URI: string) => {
    const { title, description, price, arbiter, auction_window } = formData;
    const auctionWindowInSeconds = dateToSeconds(auction_window);

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
          URI,
        ],
      });
      console.log("Yay! NFT Listed Successfully 🎉🎉");
      console.log("Txn hash: ", hash);
    } catch (error) {
      console.error("Error listing NFT:", error);
    }
  };

  const handleCreateNFT = async (event: FormEvent) => {
    event.preventDefault();

    const PinataCID = await uploadImageToPinata();
    if (!address || !PinataCID)
      return console.error("Address or PinataCID is undefined.");

    await safeMint(address, PinataCID);
    // Now event will be triggered which will trigger listNFT function

    // Safely list NFT on Marketplace
    // await listNFT(_tokenId); -- Now In useEffect

    // Create json data to upload to IPFS
    // await uploadJsonToIPFS(PinataCID);
  };

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
    <>
      <Header />
      <Box sx={{ py: 4 }}>
        <Toaster />
        <Paper sx={{ p: 4, mx: "auto", maxWidth: 800 }}>
          <form onSubmit={handleCreateNFT}>
            <Box sx={{ mb: 4, position: "relative" }}>
              <Typography
                variant="h4"
                component="h1"
                align="center"
                gutterBottom
              >
                Create Collectible Art
              </Typography>
              <Link href="/" style={{ position: "absolute", top: 0, right: 0 }}>
                <CancelOutlinedIcon fontSize="large" />
              </Link>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DropZone
                  onFileUploaded={setSelectedFile}
                  initialPreview={aiImageUrl}
                />
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
                container
                spacing={2}
                sx={{
                  justifyContent: "center", // Centers horizontally
                  alignItems: "center", // Centers vertically (if needed)
                }}
              >
                <Grid item xs={12}>
                  <TextField
                    label="Generate with AI"
                    name="prompt"
                    variant="outlined"
                    placeholder="generate a cool, antique nft image"
                    value={prompt || ""}
                    onChange={(e) => setPrompt(e.target.value)}
                    fullWidth
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={!prompt}
                    onClick={() => {
                      toast.promise(
                        handleGenerateImage(),
                        {
                          loading: "Generating AI Image...",
                          success: "Successfully Generated.",
                          error: (err) =>
                            `Oops! This just happened: ${err.toString()}`,
                        },
                        {
                          style: { minWidth: "250px" },
                          success: { duration: 5000, icon: "🔥" },
                        }
                      );
                    }}
                  >
                    Generate
                  </Button>
                </Grid>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Title"
                  name="title"
                  variant="outlined"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Description"
                  name="description"
                  variant="outlined"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Auction End Date"
                  name="auction_window"
                  variant="outlined"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={formData.auction_window}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Price (ETH)"
                  name="price"
                  variant="outlined"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">ETH</InputAdornment>
                    ),
                  }}
                  value={formData.price}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Arbiter Address"
                  name="arbiter"
                  variant="outlined"
                  placeholder="0x"
                  required
                  value={formData.arbiter}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={!address || !selectedFile}
                >
                  {isConfirming
                    ? "Confirming..."
                    : isConfirmed
                      ? "Success"
                      : "Create"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default CreateNFT;
