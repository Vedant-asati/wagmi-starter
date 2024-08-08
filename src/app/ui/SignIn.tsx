import { signInFn } from "@/server-actions";
import Button from "@mui/material/Button";

export function SignIn() {
  return (
    <form action={signInFn}>
      <Button type="submit" variant="contained" size="small">
        Sign in with Google
      </Button>
    </form>
  );
}
