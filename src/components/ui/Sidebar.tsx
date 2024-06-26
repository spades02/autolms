import React from 'react'
import { Button } from './button';
import { FcGoogle } from "react-icons/fc";
import { RiFacebookCircleFill } from "react-icons/ri";
import { FaXTwitter } from "react-icons/fa6";
import { FaYahoo } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaApple } from "react-icons/fa";

export default function Sidebar() {
  return (
      <div className="grid w-1/3 grid-cols-8 justify-normal gap-4 dark:bg-gradient-to-r dark:from-black dark:to-#FFFFFF bg-gradient-to-r from-zinc-400 to-#FFFFFF shadow-2xl py-56">
        <div className="col-start-4 ml-4 col-span-full">
          <h2 className="scroll-m-20 pb-2 mb-2 text-2xl font-semibold tracking-tight first:mt-0">
            Sign in with
          </h2>
        </div>
        <div className="col-start-3 col-end-8 outline outline-zinc-400 rounded-md outline-1">
          <Button
            className="bg-white hover:bg-slate-100 w-full text-black shadow-lg outline-slate-500 border-black"
            size={"lg"}
          >
            <div className="flex flex-row w-full justify-start gap-6">
              <div className="text-2xl">
                <FcGoogle />
              </div>
              <div className="text-md font-sans font-normal">
                <p>Sign In with Google</p>
              </div>
            </div>
          </Button>
        </div>
        <div className="col-start-3 col-span-1">
          <Button
            className="text-2xl outline outline-zinc-400 outline-1"
            size={"icon"}
            variant={"outline"}
          >
            <RiFacebookCircleFill color="#316FF6" />
          </Button>
        </div>
        <div className="col-start-4 col-span-1">
          <Button
            className="text-2xl outline outline-zinc-400 outline-1"
            size={"icon"}
            variant={"outline"}
          >
            <FaXTwitter />
          </Button>
        </div>
        <div className="col-start-5 col-span-1">
          <Button
            className="text-2xl outline outline-zinc-400 outline-1"
            size={"icon"}
            variant={"outline"}
          >
            <FaYahoo color="purple" />
          </Button>
        </div>
        <div className="col-start-6 col-span-1">
          <Button
            className="text-2xl outline outline-zinc-400 outline-1"
            size={"icon"}
            variant={"outline"}
          >
            <FaApple />
          </Button>
        </div>
        <div className="col-start-7 col-span-1">
          <Button
            className="text-2xl outline outline-zinc-400 outline-1"
            size={"icon"}
            variant={"outline"}
          >
            <FaLinkedin color="#0077b5" />
          </Button>
        </div>
      </div>
  );
}
