"use server"
import { signIn,signOut } from "@/auth";

export const signInFn = async () => {
  await signIn("google",{redirectTo:"/"});
};

export const signOutFn = async () => {
  await signOut({redirectTo:"/"});
};
