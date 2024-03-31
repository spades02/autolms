import React from "react";
import { ModeToggle } from "./ModeToggle";
import Monogram from "./Monogram";
import { Button } from "@/components/ui/button";
import { AiOutlineHome } from "react-icons/ai";
import Link from "next/link";

export default function Topbar() {
  return (
    <div className="dark:shadow-2xl shadow-xl flex w-full gap-96 justify-between mt-2">
      <div className="ml-4 mt-2">
        <Link href={"/"}>
          <Button variant="outline" size="icon">
            <AiOutlineHome fontSize={24} />
          </Button>
        </Link>
      </div>
      <div className="mr-18">
        <Monogram />
      </div>
      <div className="mr-6 mt-2">
        <ModeToggle />
      </div>
    </div>
  );
}
