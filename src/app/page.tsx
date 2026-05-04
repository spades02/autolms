import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import TextAnimation from "@/components/ui/TextAnimation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-screen h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-wrap grow justify-center ">
        <div className="flex flex-col place-content-center place-items-center gap-2">
          <div>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
              Smart Course Portal for
            </h1>
          </div>
          <div>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-blue-500">
              <TextAnimation />
            </h1>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              AI-generated transcripts, summaries, and more — built around your
              lectures.
            </p>
          </div>
          <div className="flex gap-2 m-6">
            <SignedIn>
              <Link href={"/dashboard"}>
                <Button>Open dashboard</Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href={"/sign-in"}>
                <Button>Sign in</Button>
              </Link>
              <Link href={"/sign-up"}>
                <Button className="bg-blue-600 text-white hover:bg-blue-500">
                  Sign up
                </Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </div>
  );
}
