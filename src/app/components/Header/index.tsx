
import React, { useState } from "react";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";

// MUI
import { AppBar, Toolbar, Typography, IconButton, Container } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

// Internal
import { classes } from "./styles.js";
import logo from "@/app/assets/OpenArtLogo.png";

// import AccountMenu from "@/app/ui/AccountMenu";

const Header = () => {
  const { isConnected } = useAccount();

  return (
    <>
      <CssBaseline />
      <AppBar sx={classes.header}>
        <Toolbar>
          <Link href="/" style={classes.link}>
            <img src={logo.src} alt="Galerie" style={classes.logo} />
          </Link>
          <div style={classes.account}>
            <w3m-button />
            {/* {isConnected && <AccountMenu />} */}
          </div>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
};

export default Header;
