import React, { useState } from "react";
// import { useSelector } from "react-redux";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";

// MUI
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";

// Internal
import { classes } from "./styles.js";
import logo from "@/app/assets/Logo.svg";

import AccountMenu from "@/app/ui/AccountMenu";

const Header: React.FC = () => {
  // const account = useSelector((state) => state.allNft.account);
  const { isConnected } = useAccount();

  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar sx={classes.header}>
        <Toolbar>
          <Link href="/">
            <img src={logo} alt="Galerie" style={classes.logo} />
          </Link>
          <div style={classes.account}>
            <w3m-button />
            {isConnected && <AccountMenu />}
          </div>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </React.Fragment>
  );
};

export default Header;
