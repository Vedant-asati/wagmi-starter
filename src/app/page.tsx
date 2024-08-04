"use client";

import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";

import { Account } from "./account";
import { WalletOptions } from "./wallet-options";
import { SendTransaction } from "./send-txn";

function App() {
  // const { disconnect } = useDisconnect();
  // // console.log("disconnect: ", disconnect);

  function ConnectWallet() {
    const { isConnected } = useAccount();
    if (isConnected) return <Account />;
    return <WalletOptions />;
  }

  return (
    <>
      JSR
      <ConnectWallet/>
      <SendTransaction/>
      {/* <div>
        <h2>Account</h2>
        <div>
          status: {account.status}
          <br />
          addresses: {account.addresses ? account.addresses[0] : "😶"}
          <br />
          chainId: {account.chainId}
          <br />
          <Profile />
        </div>

        {account.status === "connected" && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div> */}
    </>
  );
}

export function Profile() {
  const { address } = useAccount();
  const { data, error, status } = useEnsName({ address });
  if (status === "pending") return <div>Loading ENS name</div>;
  if (status === "error")
    return <div>Error fetching ENS name: {error.message}</div>;
  // console.log("ENS Data: ",data);
  return <div>ENS name: {data}</div>;
}

export default App;
