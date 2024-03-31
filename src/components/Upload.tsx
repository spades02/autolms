import React from 'react'
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function Upload() {
  return (
    <div className="my-4 mx-8 rounded-xl outline outline-1 shadow-lg p-16 py-28">
      <div className="flex flex-row justify-center">
        <div className="flex flex-col justify-center place-items-center gap-2">
          <div>
            <h1 className="scroll-m-20 text-5xl font-medium tracking-tight lg:text-5xl">
              +
            </h1>
          </div>
          <div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Upload Videos
            </h4>
          </div>
          <p className="font-light">
            Choose Lecture Videos you want to generate resources for.
          </p>
          <Button className="mb-8 px-28 bg-red-600 hover:bg-red-500 dark:text-white">Add Video</Button>
          <Input id='video' type='file'/>
        </div>
      </div>
    </div>
  );
}
