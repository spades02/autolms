"use client";
import {
  MultiFileDropzone,
  type FileState,
} from "@/components/MultiFileDropzone";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEdgeStore } from "@/lib/edgestore";
import { currentUser } from "@clerk/nextjs/server";
import Topbar from "@/components/ui/Topbar";
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import getClerkUserId, { getUserById } from "@/actions/user.action";
import { createProject } from "@/actions/project.action";
import { usePathname } from "next/navigation";
import { DrawerDialogDemo } from "@/components/Generated";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  AlignLeft,
  Check,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Sticker,
  X,
} from "lucide-react";

export default function Create() {
  const pathname = usePathname();

  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await getClerkUserId();
        const user = await getUserById(userId);
        setUsername(user?.username ?? null);
      } catch (err) {
        console.error("Failed to load username", err);
      }
    })();
  }, []);

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
  const [videoNames, setVideoNames] = useState<string[]>([]);

  const [nameDialog, setNameDialog] = useState<{
    open: boolean;
    defaultName: string;
    value: string;
    resolver: ((name: string) => void) | null;
  }>({ open: false, defaultName: "", value: "", resolver: null });

  const askForName = (defaultName: string): Promise<string> =>
    new Promise((resolve) => {
      setNameDialog({ open: true, defaultName, value: "", resolver: resolve });
    });

  const finishNameDialog = (chosen: string) => {
    nameDialog.resolver?.(chosen);
    setNameDialog({ open: false, defaultName: "", value: "", resolver: null });
  };
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

  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [customResults, setCustomResults] = useState<
    Array<{ name: string; content: string }>
  >([]);

  const addCustomPrompt = () =>
    setCustomPrompts((prev) => [...prev, ""]);
  const updateCustomPrompt = (idx: number, value: string) =>
    setCustomPrompts((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  const removeCustomPrompt = (idx: number) =>
    setCustomPrompts((prev) => prev.filter((_, i) => i !== idx));

  const sendUrlsToApi = async () => {
    if (!videoUrls.length) {
      setError("Upload at least one video first.");
      return;
    }
    const hasCustom = customPrompts.some((p) => p.trim() !== "");
    if (
      !quiz_check &&
      !asgn_check &&
      !notes_check &&
      !project_check &&
      !paper_check &&
      !summary_check &&
      !hasCustom
    ) {
      setError("Please select or add a resource you want to generate!");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const tempAudios: string[] = [];
      for (const url of videoUrls) {
        const response = await fetch("/api/video-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        tempAudios.push(data);
      }
      setAudios(tempAudios);

      const transcript = await sendAudioToTranscriptionApi(tempAudios);
      if (!transcript) {
        setError("Could not transcribe the uploaded video(s).");
        return;
      }

      await generate(transcript);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Something went wrong while generating resources.");
    } finally {
      setLoading(false);
    }
  };

  const sendAudioToTranscriptionApi = async (
    url: string[]
  ): Promise<string | null> => {
    if (!url || url.length === 0) {
      console.error("sendAudioToTranscriptionApi: no urls provided");
      return null;
    }
    const response = await fetch("/api/audio-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || typeof data !== "string" || !data) {
      console.error("transcription failed", response.status, data);
      return null;
    }
    setTranscriptions([data]);
    return data;
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

  const generate = async (transcript: string) => {
    const base = `Following given content is the text generated from an educational video. Be restricted to this given text, don’t use your own vector space.`;

    const tasks: Array<{
      enabled: boolean;
      prompt: string;
      set: (v: string) => void;
    }> = [
      {
        enabled: quiz_check,
        prompt: `${base} Generate a quiz containing at least 10 MCQs. Text:${transcript}`,
        set: set_incoming_quiz,
      },
      {
        enabled: asgn_check,
        prompt: `${base} Generate an assignment that can be solved by someone who has watched the video. Text:${transcript}`,
        set: set_incoming_asgn,
      },
      {
        enabled: notes_check,
        prompt: `${base} Generate lecture notes from the following content. Text:${transcript}`,
        set: set_incoming_notes,
      },
      {
        enabled: project_check,
        prompt: `${base} Generate a project idea so the viewer can practically apply the knowledge from the video. Keep it brief — just the idea, not a full implementation guide. Text:${transcript}`,
        set: set_incoming_proj,
      },
      {
        enabled: paper_check,
        prompt: `${base} Generate an exam paper with 12 short and 3 long questions. Text:${transcript}`,
        set: set_incoming_paper,
      },
      {
        enabled: summary_check,
        prompt: `${base} Generate a concise summary. Text:${transcript}`,
        set: set_incoming_summary,
      },
    ];

    const active = tasks.filter((t) => t.enabled);
    const customNames = customPrompts.map((p) => p.trim()).filter((p) => p !== "");

    const customPromptText = (name: string) =>
      `A user requested a custom educational resource named "${name}". ` +
      `First, decide whether "${name}" is a legitimate educational resource format that can be generated from a lecture transcript ` +
      `(examples of VALID types: flashcards, glossary, study guide, mind map, key terms, cheat sheet, FAQ, concept map, vocabulary list). ` +
      `Examples of INVALID inputs: a person's name, an unrelated topic, profanity, gibberish, or anything that is not a study/learning artifact. ` +
      `If "${name}" is NOT a valid educational resource type, respond with EXACTLY this single line and nothing else: INVALID_RESOURCE\n` +
      `Otherwise, generate the resource. ${base} Output only the resource itself, no preamble. Text:${transcript}`;

    const [standardResults, customRaw] = await Promise.all([
      Promise.all(active.map((t) => generateContent(t.prompt))),
      Promise.all(customNames.map((name) => generateContent(customPromptText(name)))),
    ]);

    let anySucceeded = false;
    standardResults.forEach((value, i) => {
      if (typeof value === "string" && value) {
        active[i].set(value);
        anySucceeded = true;
      }
    });

    const customOutputs: Array<{ name: string; content: string }> = [];
    const rejected: string[] = [];
    customRaw.forEach((value, i) => {
      if (typeof value !== "string" || !value) return;
      const isInvalid = value.trim().toUpperCase().startsWith("INVALID_RESOURCE");
      if (isInvalid) {
        rejected.push(customNames[i]);
      } else {
        customOutputs.push({ name: customNames[i], content: value });
        anySucceeded = true;
      }
    });
    setCustomResults(customOutputs);

    if (rejected.length > 0) {
      setError(
        `Skipped non-educational custom resource${rejected.length === 1 ? "" : "s"}: ${rejected
          .map((r) => `"${r}"`)
          .join(", ")}.`
      );
    }

    if (!anySucceeded) {
      if (rejected.length === 0) {
        setError("The model did not return any content. Check the server logs.");
      }
      return;
    }

    setGenerated(true);
  };

  async function generateContent(text: string): Promise<string | null> {
    try {
      const res = await fetch("/api/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("chatgpt route failed", res.status, result);
        return null;
      }
      return typeof result === "string" ? result : null;
    } catch (error: any) {
      console.error(error);
      setError(error.message || "An unexpected error occurred");
      return null;
    }
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
  const resourceOptions: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    checked: boolean;
    toggle: () => void;
  }> = [
    { id: "quiz", label: "Quiz", icon: HelpCircle, checked: quiz_check, toggle: () => set_quiz_check((v) => !v) },
    { id: "asgn", label: "Assignment", icon: ClipboardList, checked: asgn_check, toggle: () => set_asgn_check((v) => !v) },
    { id: "notes", label: "Lecture Notes", icon: FileText, checked: notes_check, toggle: () => set_notes_check((v) => !v) },
    { id: "proj", label: "Project Idea", icon: Lightbulb, checked: project_check, toggle: () => set_project_check((v) => !v) },
    { id: "paper", label: "Exam Paper", icon: GraduationCap, checked: paper_check, toggle: () => set_paper_check((v) => !v) },
    { id: "summary", label: "Summary", icon: AlignLeft, checked: summary_check, toggle: () => set_summary_check((v) => !v) },
  ];

  const generatedItems: Array<{ title: string; content: string; icon: React.ComponentType<{ className?: string }> }> = [
    { title: "Quiz", content: incoming_quiz, icon: HelpCircle },
    { title: "Assignment", content: incoming_asgn, icon: ClipboardList },
    { title: "Lecture Notes", content: incoming_notes, icon: FileText },
    { title: "Project Idea", content: incoming_proj, icon: Lightbulb },
    { title: "Exam Paper", content: incoming_paper, icon: GraduationCap },
    { title: "Summary", content: incoming_summary, icon: AlignLeft },
    ...customResults.map((r) => ({
      title: r.name,
      content: r.content,
      icon: Sticker as React.ComponentType<{ className?: string }>,
    })),
  ].filter((r) => r.content);

  const stageLabel = uploading ? "Uploading..." : loading ? "Generating..." : "Generate";
  const hasVideos = videoUrls.length > 0;
  const filledCustomCount = customPrompts.filter((p) => p.trim() !== "").length;
  const selectedCount =
    resourceOptions.filter((r) => r.checked).length + filledCustomCount;
  // Only the generation pipeline locks inputs. Uploads can run in the
  // background while the user keeps configuring or adds more files.
  const busy = loading;

  return (
    <div className="min-h-screen">
      <Topbar />

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
            Create a new project
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload one or more lecture videos, choose what to generate, and review the results.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: Upload */}
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                1
              </span>
              <div>
                <h2 className="text-lg font-semibold">Upload videos</h2>
                <p className="text-xs text-muted-foreground">MKV or MP4 lecture files.</p>
              </div>
            </div>

            <ScrollArea className="h-[280px] w-full rounded-md">
              <MultiFileDropzone
                className="w-full"
                disabled={busy}
                value={fileStates}
                onChange={(files) => setFileStates(files)}
                onFilesAdded={async (addedFiles) => {
                  setFileStates([...fileStates, ...addedFiles]);
                  for (let i = 0; i < addedFiles.length; i++) {
                    const addedFileState = addedFiles[i];
                    const suggestedDefault = `Video ${videoUrls.length + i + 1}`;
                    // Block on the naming dialog before kicking off the upload.
                    const chosenName = await askForName(suggestedDefault);
                    void (async () => {
                      try {
                        const res = await edgestore.publicFiles.upload({
                          file: addedFileState.file,
                          onProgressChange: async (progress) => {
                            setUploading(true);
                            updateFileProgress(addedFileState.key, progress);
                            if (progress === 100) {
                              await new Promise((resolve) => setTimeout(resolve, 1000));
                              setUploading(false);
                              updateFileProgress(addedFileState.key, "COMPLETE");
                            }
                          },
                        });
                        setVideoUrls((prev) => [...prev, res.url]);
                        setVideoNames((prev) => [...prev, chosenName]);
                      } catch (err) {
                        updateFileProgress(addedFileState.key, "ERROR");
                      }
                    })();
                  }
                }}
              />
            </ScrollArea>
          </section>

          {/* Step 2: Configure */}
          <section className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                2
              </span>
              <div>
                <h2 className="text-lg font-semibold">Choose resources</h2>
                <p className="text-xs text-muted-foreground">
                  Pick at least one. Multiple selections run in parallel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {resourceOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={opt.toggle}
                    disabled={busy}
                    aria-pressed={opt.checked}
                    className={
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50 " +
                      (opt.checked
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background hover:bg-accent hover:text-accent-foreground")
                    }
                  >
                    <span
                      className={
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors " +
                        (opt.checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-background")
                      }
                      aria-hidden="true"
                    >
                      {opt.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <Icon className={"h-4 w-4 " + (opt.checked ? "text-primary" : "text-muted-foreground")} />
                    <span className="flex-1">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-2">
              <Label className="text-xs text-muted-foreground">
                Custom resources (optional)
              </Label>
              {customPrompts.map((value, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => updateCustomPrompt(idx, e.target.value)}
                    disabled={busy}
                    placeholder="e.g. Flashcards, Glossary, Cheat sheet…"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomPrompt(idx)}
                    disabled={busy}
                    aria-label="Remove this resource"
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomPrompt}
                disabled={busy}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {customPrompts.length === 0 ? "Add custom resource" : "Add another"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4 relative pr-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <button
                  onClick={() => setError(null)}
                  className="absolute top-2 right-2 text-sm hover:opacity-70"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </Alert>
            )}

            <div className="mt-auto pt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {hasVideos ? (
                  <>
                    {videoUrls.length} video{videoUrls.length === 1 ? "" : "s"} ready ·{" "}
                    {selectedCount} resource{selectedCount === 1 ? "" : "s"} selected
                  </>
                ) : (
                  "Upload at least one video to enable generation."
                )}
              </div>
              <Button
                size="lg"
                onClick={sendUrlsToApi}
                disabled={busy || !hasVideos}
                className="gap-2"
              >
                {loading || uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {stageLabel}
              </Button>
            </div>
          </section>
        </div>

        {/* Uploaded video previews */}
        {hasVideos && (
          <section className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Uploaded videos</h3>
              <span className="text-xs text-muted-foreground">
                {videoUrls.length} file{videoUrls.length === 1 ? "" : "s"}
              </span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max gap-3 pb-2">
                {videoUrls.map((url, index) => {
                  const placeholder = `Video ${index + 1}`;
                  const name = (videoNames[index] ?? "").trim() || placeholder;
                  return (
                    <div key={index} className="shrink-0 w-60">
                      <div className="overflow-hidden rounded-md border bg-muted">
                        <video width="240" height="135" controls preload="none" className="block">
                          <source src={url} type="video/mp4" />
                        </video>
                      </div>
                      <p className="pt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{name}</span>
                        {" · "}
                        {username ?? "you"}
                      </p>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        {/* Step 3: Results */}
        {generated && generatedItems.length > 0 && (
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  3
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Generated resources</h2>
                  <p className="text-xs text-muted-foreground">
                    Click any card to view, edit, copy, or download.
                  </p>
                </div>
              </div>
              <Button onClick={saveProject} className="gap-2">
                <Save className="h-4 w-4" />
                Save project
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {generatedItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-lg border bg-background hover:bg-accent/40 transition-colors"
                  >
                    <DrawerDialogDemo title={item.title} content={item.content} />
                    <div className="pointer-events-none px-3 pb-3 -mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      Click to view
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Dialog
        open={nameDialog.open}
        onOpenChange={(open) => {
          // Closing the dialog without explicit Save/Skip = treat as Skip.
          if (!open && nameDialog.resolver) {
            finishNameDialog("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name this video</DialogTitle>
            <DialogDescription>
              Give the lecture a recognizable name, or skip to use{" "}
              <span className="font-medium text-foreground">{nameDialog.defaultName}</span>.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={nameDialog.value}
            onChange={(e) =>
              setNameDialog((prev) => ({ ...prev, value: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                finishNameDialog(nameDialog.value.trim());
              }
            }}
            placeholder={nameDialog.defaultName}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => finishNameDialog("")}>
              Skip
            </Button>
            <Button onClick={() => finishNameDialog(nameDialog.value.trim())}>
              Save name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
