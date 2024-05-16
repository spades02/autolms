"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "./ui/input";

export function conti() {
  return (
    <div className="flex flex-col rounded-lg shadow-2xl p-4  gap-2 m-4">
      <div className="mx-4 mt-2">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Generate Educational Resources
        </h1>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Select the resources you want for the lectures uploaded
        </p>
      </div>
      <div className="grid grid-cols-2 gap-8 m-4">
        <div className="flex flex-row gap-2">
          <Checkbox id="quiz" />
          <label
            htmlFor="quiz"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Quiz
          </label>
        </div>
        <div className="flex flex-row gap-2">
          <Checkbox id="assignment" />
          <label
            htmlFor="assignment"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Assignment
          </label>
        </div>
        <div className="flex flex-row gap-2">
          <Checkbox id="notes" />
          <label
            htmlFor="notes"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Lecture Notes
          </label>
        </div>
        <div className="flex flex-row gap-2">
          <Checkbox id="project" />
          <label
            htmlFor="project"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Project
          </label>
        </div>
        <div className="flex flex-row gap-2">
          <Checkbox id="paper" />
          <label
            htmlFor="paper"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Exam Paper
          </label>
        </div>
        <div className="flex flex-row gap-2">
          <Checkbox id="summary" />
          <label
            htmlFor="summary"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Summary
          </label>
        </div>
      </div>
      <div className="flex flex-row gap-2">
        <Input
          type="text"
          placeholder="Enter any other resource name you want to generate..."
        />
      </div>

      <div>
        <button
          style={{
            backgroundColor: "white",
            color: "black",
            borderRadius: "2px",
            padding: "5px",
            width: "100vh",
            marginTop: "2px",
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
