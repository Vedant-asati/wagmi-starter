import React, { useState } from "react";
// import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CssBaseline from "@mui/material/CssBaseline";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import IconButton from "@mui/material/IconButton";

import { classes } from "./styles.js";
import { Account } from "@/app/utils/Account";
import AccountMenu from "@/app/utils/AccountMenu";
import { WalletOptions } from "../../utils/WalletOptions";
// import { SendTransaction } from "../../utils/send-txn";

import logo from "@/assets/Logo.svg";

function ConnectWallet() {
  const { isConnected } = useAccount();
  if (isConnected) return <Account />;
  return <WalletOptions />;
}

const Header: React.FC = () => {
  // const account = useSelector((state) => state.allNft.account);
  const { isConnected } = useAccount();
  const [showConnectWalletModal, setshowConnectWalletModal] = useState(false);

  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar sx={classes.header}>
        <Toolbar>
          <Link to="/">
            <img src={logo} alt="Galerie" style={classes.logo} />
          </Link>
          <div style={classes.account}>
            {showConnectWalletModal && <ConnectWallet />}
            {!isConnected && <IconButton
              // sx={classes.walletIcon}
              aria-label="Connect wallet button"
              onClick={() => setshowConnectWalletModal(!showConnectWalletModal)}
            >
              <AccountBalanceWalletIcon titleAccess="Connect wallet button" />
            </IconButton>}
            {isConnected && <AccountMenu />}
          </div>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </React.Fragment>
  );
};

export default Header;
