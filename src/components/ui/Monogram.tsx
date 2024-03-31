import React from "react";
import logo from "../../../public/autolms-nav.png";
import Image from "next/image";

export default function Monogram() {
  return (
    <div className="flex gap-4">
      <div className="mb-2">
        <Image src={logo} alt="AutoLMS logo" className="h-16 w-16" />
      </div>
      <div className="mt-5">
        <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight ">
          AutoLMS
        </h1>
      </div>
    </div>
  );
}
