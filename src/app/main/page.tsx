"use client";
import {
  MultiFileDropzone,
  type FileState,
} from "@/components/MultiFileDropzone";
import { useEdgeStore } from "@/lib/edgestore";
import { currentUser } from "@clerk/nextjs/server";
import Topbar from "@/components/ui/Topbar";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function main() {
  var [quiz_check, set_quiz_check] = useState(false);
  var [asgn_check, set_asgn_check] = useState(false);
  var [notes_check, set_notes_check] = useState(false);
  var [project_check, set_project_check] = useState(false);
  var [paper_check, set_paper_check] = useState(false);
  var [summary_check, set_summary_check] = useState(false);

  var [incoming_quiz, set_incoming_quiz] = useState("");
  var [incoming_asgn, set_incoming_asgn] = useState("");
  var [incoming_notes, set_incoming_notes] = useState("");
  var [incoming_proj, set_incoming_proj] = useState("");
  var [incoming_paper, set_incoming_paper] = useState("");
  var [incoming_summary, set_incoming_summary] = useState("");
  var [incoming_additionals, set_incoming_additionals] = useState("");

  var quiz = "";
  var asgn = "";
  var notes = "";
  var project = "";
  var paper = "";
  var summary = "";

  const [file, setFile] = useState<File>();

  const [uploads, setUploads] = useState<
    Array<{ url: string; filename: string }>
  >([]);
  const [uploadRes, setUploadRes] = useState<{
    url: string;
    filename: string;
  }>();

  const addUpload = (newUpload: { url: string; filename: string }) => {
    setUploads([...uploads, newUpload]);
  };

  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const { edgestore } = useEdgeStore();

  function updateFileProgress(key: string, progress: FileState["progress"]) {
    setFileStates((fileStates) => {
      const newFileStates = structuredClone(fileStates);
      const fileState = newFileStates.find(
        (fileState) => fileState.key === key
      );
      if (fileState) {
        fileState.progress = progress;
      }

      return newFileStates;
    });
  }
  const handleVideoInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const formData = new FormData();
      const files = event.target.files;
      if (files) {
        const file = files[0];
      }
      console.log(filesArray);
      console.log(filesArray.length);
      // console.log(file)
      if (!files) {
        console.error("No file selected");
        return;
      }

      // Check if createObjectURL is supported
      if (!window.URL || !window.URL.createObjectURL) {
        console.error("createObjectURL is not supported in this browser");
        return;
      }
      // Create a URL for the selected file and set it as the video's source
    } catch (error) {
      console.error("Error creating object URL:", error);
    }
  };

  const [promptInput, setPromptInput] = useState("");

  const handlePrompt = (e: any) => {
    setPromptInput(e.target.value);
  };

  const generate = async () => {
    const formData = new FormData();

    const videoError = document.getElementById(
      "video_error_block"
    ) as HTMLElement;
    const contentSelectError = document.getElementById(
      "content_select_error_block"
    ) as HTMLElement;
    const errorInput = document.getElementById(
      "error_input"
    ) as HTMLInputElement;

    videoError.style.display = "none";
    errorInput.style.display = "none";

    if (
      quiz_check === false &&
      asgn_check === false &&
      notes_check === false &&
      project_check === false &&
      paper_check === false &&
      summary_check === false &&
      promptInput === ""
    ) {
      contentSelectError.style.display = "block";
      videoError.style.display = "none";
    } else {
      contentSelectError.style.display = "none";
      if (quiz_check === true) {
        quiz = "Quiz (MCQs) atleast 10";
      }
      if (asgn_check === true) {
        asgn = "Assignment";
      }
      if (notes_check === true) {
        notes = "Lecture Notes";
      }
      if (project_check === true) {
        project = "Project Idea";
      }
      if (paper_check === true) {
        paper = "Exam Paper";
      }
      if (summary_check === true) {
        summary = "Summary";
      }
      // if(english_check === true)
      // {
      //     language_support = 'Genertae the resources in english language regardless what language is in the text.'
      // }
      // if(non_english_check === true)
      // {
      //     language_support = 'Genertae the resources in the language in the text given, also keep in mind that you have to generate response in the same font of that language, not in english writing.'
      // }

      formData.append("quiz", quiz);
      formData.append("asgn", asgn);
      formData.append("notes", notes);
      formData.append("project", project);
      formData.append("paper", paper);
      formData.append("summary", summary);
      formData.append("promptInput", promptInput);
      // formData.append('language_support', language_support);

      uploads.map((upload, index) => {
        formData.append(`video${index}`, upload.url);
      });

      // for (const entry of formData.entries()) {
      //     console.log(entry[0], entry[1]);
      // }

      // console.log('i am off')

      // for (let pair of formData.entries()) {
      //     console.log(pair[0], pair[1]);
      // }

      // (document.getElementById("overlay") as HTMLElement).style.display =
      //   "block";
      console.log("siuuuuu");
      const response = await fetch("http://127.0.0.1:5000/generate_content", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          return response.json(); // Assuming the backend responds with JSON data
        })
        .then((data) => {
          if (data.error) {
            errorInput.style.display = "block";
            errorInput.value = data.error;
          } else {
            console.log("Response from backend:", data);

            const [quiz, asgn, notes, proj, additionals] = data;
            (
              document.getElementById("generated_quiz") as HTMLInputElement
            ).value = quiz;
            (
              document.getElementById("generated_asgn") as HTMLInputElement
            ).value = asgn;
            (
              document.getElementById("generated_notes") as HTMLInputElement
            ).value = notes;
            (
              document.getElementById("generated_project") as HTMLInputElement
            ).value = proj;
            (
              document.getElementById("generated_paper") as HTMLInputElement
            ).value = paper;
            (
              document.getElementById("generated_summary") as HTMLInputElement
            ).value = summary;
            (
              document.getElementById(
                "generated_additionals"
              ) as HTMLInputElement
            ).value = additionals;

            set_incoming_quiz(quiz);
            set_incoming_asgn(asgn);
            set_incoming_notes(notes);
            set_incoming_proj(proj);
            set_incoming_paper(paper);
            set_incoming_summary(summary);
            set_incoming_additionals(additionals);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };
  return (
    <div>
      <Topbar />
      <div>
        <div className="flex flex-col justify-between sm:flex-row mx-8">
          <div className="mt-8">
            <div className="p-4 outline-1 m-2 shadow-xl rounded-lg w-full">
              <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl">
                Upload
              </h1>
              <MultiFileDropzone
                value={fileStates}
                onChange={(files) => {
                  setFileStates(files);
                }}
                onFilesAdded={async (addedFiles) => {
                  setFileStates([...fileStates, ...addedFiles]);
                  await Promise.all(
                    addedFiles.map(async (addedFileState) => {
                      try {
                        const res = await edgestore.protectedFiles.upload({
                          file: addedFileState.file,
                          onProgressChange: async (progress) => {
                            updateFileProgress(addedFileState.key, progress);
                            if (progress === 100) {
                              // wait 1 second to set it to complete
                              // so that the user can see the progress bar at 100%
                              await new Promise((resolve) =>
                                setTimeout(resolve, 1000)
                              );
                              updateFileProgress(
                                addedFileState.key,
                                "COMPLETE"
                              );
                            }
                          },
                        });
                        setUploadRes({
                          url: res.url,
                          filename: File.name,
                        });
                        if (uploadRes) {
                          addUpload(uploadRes);
                          console.log(uploads);
                        }
                      } catch (err) {
                        updateFileProgress(addedFileState.key, "ERROR");
                      }
                    })
                  );
                }}
              />
              {uploadRes && (
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    controls
                    autoPlay
                  >
                    <source src={uploadRes.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex flex-col rounded-lg shadow-2xl p-4  gap-4 m-4">
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
                  <Checkbox
                    id="quiz"
                    onCheckedChange={() => {
                      set_quiz_check(!quiz_check);
                    }}
                    name="quiz"
                  />
                  <label
                    htmlFor="quiz"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Quiz
                  </label>
                </div>
                <div className="flex flex-row gap-2">
                  <Checkbox
                    id="assignment"
                    onCheckedChange={() => {
                      set_asgn_check(!asgn_check);
                    }}
                    name="asgn"
                  />
                  <label
                    htmlFor="assignment"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Assignment
                  </label>
                </div>
                <div className="flex flex-row gap-2">
                  <Checkbox
                    id="notes"
                    onCheckedChange={() => {
                      set_notes_check(!notes_check);
                    }}
                    name="notes"
                  />
                  <label
                    htmlFor="notes"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Lecture Notes
                  </label>
                </div>
                <div className="flex flex-row gap-2">
                  <Checkbox
                    id="project"
                    onCheckedChange={() => {
                      set_project_check(!project_check);
                    }}
                    name="project"
                  />
                  <label
                    htmlFor="project"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Project
                  </label>
                </div>
                <div className="flex flex-row gap-2">
                  <Checkbox
                    id="paper"
                    onCheckedChange={() => {
                      set_paper_check(!paper_check);
                    }}
                    name="paper"
                  />
                  <label
                    htmlFor="paper"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Exam Paper
                  </label>
                </div>
                <div className="flex flex-row gap-2">
                  <Checkbox
                    id="summary"
                    onCheckedChange={() => {
                      set_summary_check(!summary_check);
                    }}
                    name="summary"
                  />
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
                  id="prompt"
                  autoFocus
                  value={promptInput}
                  onChange={handlePrompt}
                  placeholder="Enter any other resource name you want to generate..."
                />
              </div>
              <div>
                <div id="error_block">
                  <p
                    id="video_error_block"
                    className="hidden text-red-500 ml-2 text-left mb-2"
                  >
                    Please select a video
                  </p>
                  <p
                    id="content_select_error_block"
                    className="hidden text-red-500 ml-2 text-left mb-2"
                  >
                    Please add or select a resource
                  </p>
                  <p
                    id="backend_error_bloack"
                    className="hidden text-red-500 ml-2 text-left mb-2"
                  >
                    <input type="text" id="error_input" />
                  </p>
                </div>
                <Button className="w-full" onClick={generate}>
                  Generate
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Generated Resources
          </h1>
        </div>
        <div className="flex flex-row gap-2 m-8">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea value={incoming_quiz} id="message" />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea placeholder="Type your message here." id="message" />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea placeholder="Type your message here." id="message" />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea placeholder="Type your message here." id="message" />
          </div>
          {uploadRes && (
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <video
                className="absolute inset-0 w-full h-full object-cover"
                controls
                autoPlay
              >
                <source src={uploadRes.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          <div></div>
        </div>
      </div>
    </div>
  );
}
