// import CustomLink from "@/components/custom-link"
import SessionData from "@/app/components/session-data";
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();
  console.log(session);
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">React Server Component Usage</h1>
      <p>
        This page is server-rendered as a React Server Component{" "}
        <code>auth()</code>
        method.
      </p>
      <SessionData session={session} />
    </div>
  );
}
