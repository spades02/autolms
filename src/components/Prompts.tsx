"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { toast } from 'react-toastify';
import { useState } from "react";

export function Prompts() {
  
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

  const [promptInput, setPromptInput] = useState("");

  const handlePrompt = (e: any) => {
    setPromptInput(e.target.value);
  };

  const generate = () => {
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
          (
            document.getElementById("generated_quiz_block") as HTMLElement
          ).style.display = "block";
        }
        if (asgn_check === true) {
          asgn = "Assignment";
          (
            document.getElementById("generated_asgn_block") as HTMLElement
          ).style.display = "block";
        }
        if (notes_check === true) {
          notes = "Lecture Notes";
          (
            document.getElementById("generated_notes_block") as HTMLElement
          ).style.display = "block";
        }
        if (project_check === true) {
          project = "Project Idea";
          (
            document.getElementById("generated_project_block") as HTMLElement
          ).style.display = "block";
        }
        if (paper_check === true) {
          paper = "Exam Paper";
          (
            document.getElementById("generated_paper_block") as HTMLElement
          ).style.display = "block";
        }
        if (summary_check === true) {
          summary = "Summary";
          (
            document.getElementById("generated_summary_block") as HTMLElement
          ).style.display = "block";
        }
        if (promptInput !== "") {
          (
            document.getElementById(
              "generated_additionals_block"
            ) as HTMLElement
          ).style.display = "block";
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

        // for (const entry of formData.entries()) {
        //     console.log(entry[0], entry[1]);
        // }

        // console.log('i am off')

        // for (let pair of formData.entries()) {
        //     console.log(pair[0], pair[1]);
        // }

        (document.getElementById("overlay") as HTMLElement).style.display =
          "block";

        fetch("http://127.0.0.1:5000/generate_content", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            (document.getElementById("overlay") as HTMLElement).style.display =
              "none";
            return response.json(); // Assuming the backend responds with JSON data
          })
          .then((data) => {
            if (data.error) {
              errorInput.style.display = "block";
              errorInput.value = data.error;
            } else {
              console.log("Response from backend:", data);
              const subcontent_footer = document.getElementById(
                "sub_content_footer"
              ) as HTMLElement;
              subcontent_footer.style.display = "block";

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

  // function addFile(file)
  //   {
  //       setFilesArray((prevFilesArray) => [...prevFilesArray, file]);
  //   };

  // const handleUpload = () => {
  //    // Replace with your actual video URL

  //   fetch("/api/upload-video", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ videoUrl }),
  //   })
  //     .then((response) => {
  //       if (response.ok) {
  //         console.log("Video URL sent successfully");
  //         // Do something after successful upload
  //       } else {
  //         console.error("Failed to send video URL");
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error sending video URL:", error);
  //     });
  // };

  return (
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
  );
}