import { signOutFn } from "@/server-actions";
import Button from "@mui/material/Button";

export function SignOut() {
  return (
    <form action={signOutFn}>
      <Button type="submit" variant="contained" size="small">
        Sign Out
      </Button>
    </form>
  );
}
