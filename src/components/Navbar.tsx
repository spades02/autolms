import Image from "next/image";
import React from "react";
import logo from "../../public/autolms-nav.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "./ui/ModeToggle";

export default function Navbar() {
  return (
    <div className="w-full flex px-4 py-2">
      <Image src={logo} alt="AutoLMS logo" className="h-16 w-16" />
      <div className="flex pl-4 pt-4 justify-between w-full">
        <div>
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight ">
            AutoLMS
          </h1>
        </div>
        <div className="flex">
          <ModeToggle />
          <Avatar className="ml-4">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
