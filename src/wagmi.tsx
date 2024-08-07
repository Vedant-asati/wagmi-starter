import {
  http,
  cookieStorage,
  createConfig,
  createStorage,
  WagmiProvider,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
// import { getDefaultConfig } from 'connectkit'

export function getConfig() {
  const projectId: string = process.env.NEXT_PUBLIC_WC_PROJECT_ID
    ? process.env.NEXT_PUBLIC_WC_PROJECT_ID
    : "9305397e1ae40fc339c6bdfe155bb3c3";
  console.log(typeof projectId, projectId);
  return createConfig({
    chains: [mainnet, sepolia],
    connectors: [
      injected(),
      coinbaseWallet(),
      walletConnect({ projectId: projectId }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  });
}
// For ConnectKit-walletConnect
// export function getConfig() {
//   return createConfig(
//     getDefaultConfig({
//     chains: [mainnet],
//     transports: {
//       [mainnet.id]: http( `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`,)
//     },
//     walletConnectProjectId:"9305397e1ae40fc339c6bdfe155bb3c3",
//      // Required App Info
//      appName: "Your App Name",

//      // Optional App Info
//      appDescription: "Your App Description",
//      appUrl: "https://family.co", // your app's url
//      appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)

//     // connectors: [
//     //   injected(),
//     //   coinbaseWallet(),
//     //   // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID }),
//     // ],
//     // storage: createStorage({
//     //   storage: cookieStorage,
//     // }),
//     // ssr: true,
//   }),
// );
// }

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
