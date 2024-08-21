"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useState } from "react";

// MUI
import { Container, Box, Typography, Button, Grid } from "@mui/material";
// import Carousel  from 'react-material-ui-carousel';
import { Paper } from '@mui/material';

// Internal
import Header from "./components/Header";
import { SignIn } from "./ui/SignIn";
import { SignOut } from "./ui/SignOut";
import Home from "./components/Home/page";
import { SendTransaction } from "./ui/SendTxn";
import logo from "@/app/assets/OpenArtLogo.png";
import Carousel from "./ui/Carousel";


function App() {
  const { isConnected } = useAccount();

  const imgData = [
    { img: '@/app/assets/images/1.png', title: 'Image 1' },
    { img: '@/app/assets/images/2.png', title: 'Image 2' },
    { img: '@/app/assets/images/3.png', title: 'Image 3' },
    { img: '@/app/assets/images/4.png', title: 'Image 4' },
    { img: '@/app/assets/images/5.png', title: 'Image 5' },
    { img: '@/app/assets/images/6.png', title: 'Image 6' },
    { img: '@/app/assets/images/7.png', title: 'Image 7' },
    { img: '@/app/assets/images/8.png', title: 'Image 8' },
    // { img: '@/app/assets/images/9.png', title: 'Image 9' },
    // { img: '@/app/assets/images/10.png', title: 'Image 10' },
    // { img: '@/app/assets/images/11.png', title: 'Image 11' },
    // { img: '@/app/assets/images/12.png', title: 'Image 12' },
    // { img: '@/app/assets/images/13.png', title: 'Image 13' },
    // { img: '@/app/assets/images/14.png', title: 'Image 14' },
  ];

  return (
    <Container maxWidth="lg">
      <Header />
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h4" gutterBottom>Welcome to OpenArt </Typography>
      </Box>  
      <Carousel imgData={imgData}/>
      <Box sx={{ textAlign: "center", pt:1, pb:2 }}>
      <Link href="/create-nft">
        <Button variant="outlined">Create your Art</Button>
      </Link>
      </Box>
      <Typography variant="h5">Top Trending Arts</Typography>
      <Home />
    </Container>
  );
}

export default App;
