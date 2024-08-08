import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from "wagmi";
import Typography from "@mui/material/Typography";

export function Account() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  const shortAddress = address
    ? address.slice(0, 5) + "..." + address.slice(-3)
    : "";

  return (
    <div>
      {ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
      <Typography variant="subtitle1">
        {address && (
          <div>{ensName ? `${ensName} (${shortAddress})` : shortAddress}</div>
        )}
      </Typography>
    </div>
  );
}
