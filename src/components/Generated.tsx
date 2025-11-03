
"use client";
import * as React from "react";
import { MdOutlineContentCopy } from "react-icons/md";
import { MdOutlineFileDownload } from "react-icons/md";
import { FaEdit } from "react-icons/fa";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
    title: string;
    content: string;
}

export function DrawerDialogDemo(props:Props) {
  const [open, setOpen] = React.useState(false);
  //const isDesktop = useMediaQuery("(min-width: 768px)");

//   if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-full w-full">
            {props.title}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px] max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogDescription>
              <div className="flex flex-row gap-2 justify-end">
                <Button variant={"outline"} className="">
                  <MdOutlineContentCopy />
                </Button>
                <Button variant={"outline"} className="">
                  <FaEdit />
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
          <ProfileForm title={props.title} content={props.content} />
        </DialogContent>
      </Dialog>
    );
  }

//   return (
//     <Drawer open={open} onOpenChange={setOpen}>
//       <DrawerTrigger asChild>
//         <Button variant="outline">Edit Quiz</Button>
//       </DrawerTrigger>
//       <DrawerContent>
//         <DrawerHeader className="text-left">
//           <DrawerTitle>Edit Quiz</DrawerTitle>
//           <DrawerDescription>
//             Make changes to your quiz here. Click save when you're done.
//           </DrawerDescription>
//         </DrawerHeader>
//         <ProfileForm className="px-4" />
//         <DrawerFooter className="pt-2">
//           <DrawerClose asChild>
//             <Button variant="outline">Cancel</Button>
//           </DrawerClose>
//         </DrawerFooter>
//       </DrawerContent>
//     </Drawer>
//   );


function ProfileForm(props:Props) {
    const [incoming_quiz, set_incoming_quiz] = useState("Quiz")
    const handleEditedQuiz = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        set_incoming_quiz(e.target.value);
    };
    const saveEditedQuiz = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      set_incoming_quiz(e.target.value);
    };
  return (
    <div className="overflow-y-scroll h-96 w-full grid gap-2">
      <div className="grid gap-2">
        <p className="">{props.content}</p>
      </div>
    </div>
  );
}
