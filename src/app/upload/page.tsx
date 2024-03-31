import Upload from "@/components/Upload";
import Topbar from "@/components/ui/Topbar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import React from "react";

export default function upload() {
  return (
    <div>
      <Topbar />
      <div>
        <div className="mx-8 mt-4">
          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Upload
          </h2>
        </div>
        <div className="flex flex-row gap-2">
          <div className="">
            <Upload />
          </div>
          <div className="bg-blue-200">
            <Carousel
              opts={{
                dragFree: true,
                loop: false,
              }}
            >
              <CarouselContent>
                <CarouselItem></CarouselItem>
                <CarouselItem>2</CarouselItem>
                <CarouselItem>3</CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
}
