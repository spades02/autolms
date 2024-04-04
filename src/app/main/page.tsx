import {Upload} from "@/components/Upload";
import Topbar from "@/components/ui/Topbar";
import { Button } from "@/components/ui/button";
import { FaTrashAlt } from "react-icons/fa";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import React from "react";
import { Prompts } from "@/components/Prompts";

export default function main() {
  return (
    <div>
      <Topbar />
      <div>
        <div className="flex flex-col justify-between sm:flex-row mx-8">
          <div className="mt-8">
            <Upload />
          </div>
          <div>
            <Prompts/>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <div className=""></div>
          {/* <div className="bg-blue-200 w-screen my-4 mr-12">
            <Carousel
              opts={{
                dragFree: true,
                loop: false,
              }}
            >
              <CarouselContent>
                <CarouselItem className="basis-1/3">
                  <div className="flex flex-col place-items-center">
                    <div>Video goes here</div>
                    <div>
                      <Button size={"icon"} className="rounded-full shadow-lg">
                        <FaTrashAlt className="text-lg" />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-1/3">
                  <div className="flex flex-col place-items-center">
                    <div>Video goes here</div>
                    <div>
                      <Button size={"icon"} className="rounded-full shadow-lg">
                        <FaTrashAlt className="text-lg" />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-1/3">
                  <div className="flex flex-col place-items-center">
                    <div>Video goes here</div>
                    <div>
                      <Button size={"icon"} className="rounded-full shadow-lg">
                        <FaTrashAlt className="text-lg" />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div> */}
        </div>
      </div>
    </div>
  );
}
