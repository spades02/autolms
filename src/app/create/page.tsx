"use client";
import {
  MultiFileDropzone,
  type FileState,
} from "@/components/MultiFileDropzone";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEdgeStore } from "@/lib/edgestore";
import { currentUser } from "@clerk/nextjs/server";
import Topbar from "@/components/ui/Topbar";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import getClerkUserId, { getUserById } from "@/actions/user.action";
import { createProject } from "@/actions/project.action";
import { usePathname } from "next/navigation";
import { DrawerDialogDemo } from "@/components/Generated";

export default function Create() {
  const pathname = usePathname();

  const [quiz_check, set_quiz_check] = useState(false);
  const [asgn_check, set_asgn_check] = useState(false);
  const [notes_check, set_notes_check] = useState(false);
  const [project_check, set_project_check] = useState(false);
  const [paper_check, set_paper_check] = useState(false);
  const [summary_check, set_summary_check] = useState(false);

  const [incoming_quiz, set_incoming_quiz] = useState("");
  const [incoming_asgn, set_incoming_asgn] = useState("");
  const [incoming_notes, set_incoming_notes] = useState("");
  const [incoming_proj, set_incoming_proj] = useState("");
  const [incoming_paper, set_incoming_paper] = useState("");
  const [incoming_summary, set_incoming_summary] = useState("");
  const [incoming_additionals, set_incoming_additionals] = useState("");

  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState<string[]>([]);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);

  const [uploads, setUploads] = useState<Array<{ url: string }>>([]);
  const [uploadRes, setUploadRes] = useState<{
    url: string;
    filename: string;
  }>();

  const addUpload = (newUpload: { url: string }) => {
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

  const sendUrlsToApi = async () => {
    setLoading(true);
    const tempAudios: string[] = [];

    for (const url of videoUrls) {
      const response = await fetch("/api/video-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      tempAudios.push(data.message);
    }

    setAudios(tempAudios);
    // setAudios([
    //   "https://apyhub-outgoing.s3.eu-west-1.amazonaws.com/29dd8c51-b035-4d21-9a14-60df38a4c89c/video-audio/_extract_video_audio_url/video-clips/test-sample_2024-05-22T00%3A01%3A49.149.mp3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIARJOHWS6LXQRAG7X6%2F20240522%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240522T000149Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=e4e0e586bd3fcec75724f78bd01224358f76f1084d784349198584651f593e95",
    // ]);

    setLoading(false);
    sendAudioToTranscriptionApi(audios);
  };

  const sendAudioToTranscriptionApi = async (url: string[]) => {
    const response = await fetch("/api/audio-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    console.log("data", data);
    setTranscriptions([data]); //append the transcription
    // const transcriptionText = "course on database, today we will learn mySQL queries"
    // setTranscriptions(["course on database , today we will learn primary key"])
    // setTranscriptions((prevTranscriptions) => [...prevTranscriptions, transcriptionText]);
    // return data.text;
    generate();
  };

  const processAudios = async () => {
    setLoading(true);
    // const transcriptionsResults: string[] = [];
    // for (const audioUrl of audios) {
    //   try {
    //     const transcriptionText = await sendAudioToTranscriptionApi(audioUrl);
    //     transcriptionsResults.push(transcriptionText);
    //   } catch (error) {
    //     console.error("Error transcribing audio:", error);
    //     transcriptionsResults.push("Error transcribing audio");
    //   }
    // }
    // setTranscriptions(transcriptionsResults);
    setLoading(false);
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
        console.log("quizzz check", transcriptions);
        const quiz: string = await generateContent(
          `Following given content is the text generated from an educational video. Generate a quiz that can be solved by someone who has the following knowledge. Be restricted to this given text, don’t use your own vector space for information on the topic. The quiz should contain at least 10 MCQs. Text:${transcriptions}`
        );

        if (quiz) {
          set_incoming_quiz(quiz);
          console.log("INCOMING", incoming_quiz);
        }
      }
      if (asgn_check === true) {
        const asgn: string = await generateContent(
          `Following given content is the text generated from an educational video. Generate an assignment that can be solved by someone who has watched the video and learnt from it. Be restricted to this given text, don’t use your own vector space. Text:${transcriptions}`
        );
        set_incoming_asgn(asgn);
      }
      if (notes_check === true) {
        const notes: string = await generateContent(
          `Following given content is the text generated from an educational video. Generate lecture notes from the following content given. Be restricted to this given text, don’t use your own vector space. Text:${transcriptions}`
        );
        set_incoming_notes(notes);
      }
      if (project_check === true) {
        const proj: string = await generateContent(
          `Following given content is the text generated from an educational video. Generate a project idea such that the person who has watched the video(s) can implement their newly attained knowledge from the video to practically apply the knowledge.Don't try to explain everything, just give some basic idea for practical implementation of the knowledge. Be restricted to this given text, don’t use your own vector space. Text:${transcriptions}`
        );
        set_incoming_proj(proj);
      }
      if (paper_check === true) {
        const paper: string = await generateContent(
          `Following given content is the text generated from an educational video. Generate a paper with 12 short and 3 long questions from the following content given. Be restricted to this given text, don’t use your own vector space. Text:${transcriptions}`
        );
        set_incoming_paper(paper);
      }
      if (summary_check === true) {
        const summary: string = await generateContent(
          `Following given content is the text generated from an educational video. Generate a summary from the following content given. Be restricted to this given text, don’t use your own vector space. Text:${transcriptions}`
        );
        set_incoming_summary(summary);
      }
    }
  };

  async function generateContent(text: string) {
    console.log(text);
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

    try {
      const res = await fetch("/api/chatgpt", {
        method: "POST",
        body: JSON.stringify({
          text: text,
        }),
      });

      const result = await res.json();
      console.log("resuulllltttt", result);
      const result_string = JSON.stringify(result);
      console.log("sheikh chillii", result_string);
      return result;
    } catch (error: any) {
      console.error(error);
      errorInput.style.display = "block";
      errorInput.value = error;
    }
    // finally{
    //   saveProject();
    // }
  }

  async function saveProject() {
    const userId = await getClerkUserId();
    const mongoUser = await getUserById(userId);
    const mongoUserId = JSON.stringify(mongoUser);
    try {
      const session = await createProject({
        title: "hello",
        videoLinks: videoUrls,
        quiz: incoming_quiz,
        asgn: incoming_asgn,
        notes: incoming_notes,
        proj: incoming_proj,
        paper: incoming_paper,
        summary: incoming_summary,
        author: JSON.parse(mongoUserId),
        path: pathname,
      });
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div>
      <Topbar />
      <div>
        <div className="grid grid-cols-2 gap-8 justify-between sm:flex-row mx-8">
          <div className="mt-8 col-span-1">
            <div className="p-4 outline-1 m-2 shadow-xl rounded-lg w-full">
              <h1 className="scroll-m-20 pb-2 text-2xl font-extrabold tracking-tight lg:text-3xl">
                Upload
              </h1>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <MultiFileDropzone
                  className="w-full"
                  value={fileStates}
                  onChange={(files) => {
                    setFileStates(files);
                  }}
                  onFilesAdded={async (addedFiles) => {
                    setFileStates([...fileStates, ...addedFiles]);
                    await Promise.all(
                      addedFiles.map(async (addedFileState) => {
                        try {
                          const res = await edgestore.publicFiles.upload({
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
                          console.log("VIDURLS", videoUrls);
                          setVideoUrls((prevUrls) => [...prevUrls, res.url]);
                        } catch (err) {
                          updateFileProgress(addedFileState.key, "ERROR");
                        }
                      })
                    );
                  }}
                />
              </ScrollArea>
            </div>
          </div>
          <div className="col-span-1">
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
                <Button
                  className="w-full"
                  onClick={sendUrlsToApi} //check this
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Generate"}
                </Button>
              </div>
            </div>
          </div>
          {videoUrls && videoUrls.length > 0 && (
            <div className="col-span-2 w-full">
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                  {videoUrls.map((url, index) => (
                    <div key={index} className="shrink-0">
                      <div className="overflow-hidden rounded-md">
                        <video width="320" height="240" controls preload="none">
                          <source src={url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <figcaption className="pt-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Video {index + 1}
                        </span>
                        by username
                      </figcaption>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="m-4 rounded-xl shadow-2xl drop-shadow-2xl">
          <div>
            <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
              Generated Resources
            </h1>
          </div>
          <div className="flex flex-row gap-2 m-8 h-28">
            {incoming_quiz && (
              <div className="w-full">
                <DrawerDialogDemo title="Quiz" content={incoming_quiz} />
              </div>
            )}
            {incoming_asgn && (
              <div className="w-full">
                <DrawerDialogDemo title="Assignment" content={incoming_asgn} />
              </div>
            )}
            {incoming_notes && (
              <div className="grid w-full gap-1.5">
                <DrawerDialogDemo
                  title="Lecture Notes"
                  content={incoming_notes}
                />
              </div>
            )}
            {incoming_proj && (
              <div className="grid w-full gap-1.5">
                <DrawerDialogDemo
                  title="Project Idea"
                  content={incoming_proj}
                />
              </div>
            )}
            {incoming_paper && (
              <div className="w-full ">
                <DrawerDialogDemo title="Exam Paper" content={incoming_paper} />
              </div>
            )}
            {incoming_summary && (
              <div className="grid w-full gap-1.5">
                <DrawerDialogDemo title="Summary" content={incoming_summary} />
              </div>
            )}

            <div>
              <Button onClick={saveProject}>Save Project</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
