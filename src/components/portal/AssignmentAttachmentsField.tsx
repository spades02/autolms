"use client";

import { useState } from "react";
import { Trash2, Paperclip } from "lucide-react";
import {
  MultiFileDropzone,
  type FileState,
} from "@/components/MultiFileDropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useEdgeStore } from "@/lib/edgestore";

export type Attachment = { url: string; name: string; size?: number };

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
};

export default function AssignmentAttachmentsField({
  attachments,
  onChange,
  disabled,
}: {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
  disabled?: boolean;
}) {
  const { edgestore } = useEdgeStore();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileState[]>([]);

  function setFileProgress(key: string, progress: FileState["progress"]) {
    setFiles((prev) =>
      prev.map((f) => (f.key === key ? { ...f, progress } : f)),
    );
  }

  async function uploadOne(state: FileState) {
    try {
      const result = await edgestore.assignmentAttachments.upload({
        file: state.file,
        onProgressChange: (p) => setFileProgress(state.key, p),
      });
      setFileProgress(state.key, "COMPLETE");
      onChange([
        ...attachments,
        { url: result.url, name: state.file.name, size: result.size },
      ]);
      // Drop completed file from the staging list so the dropzone reads as empty.
      setFiles((prev) => prev.filter((f) => f.key !== state.key));
    } catch (err: any) {
      setFileProgress(state.key, "ERROR");
      toast({
        title: "Upload failed",
        description: err?.message ?? "Try a different file.",
      });
    }
  }

  function onFilesAdded(added: FileState[]) {
    setFiles((prev) => [...prev, ...added]);
    for (const a of added) {
      void uploadOne(a);
    }
  }

  function remove(idx: number) {
    onChange(attachments.filter((_, i) => i !== idx));
  }

  return (
    <div className="grid gap-2">
      <Label>Reference attachments (PDF / DOC / PPT / XLSX / ZIP)</Label>

      {attachments.length > 0 ? (
        <ul className="grid gap-1 mb-1">
          {attachments.map((a, idx) => (
            <li
              key={`${a.url}-${idx}`}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 hover:underline truncate"
              >
                {a.name}
              </a>
              {!disabled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!disabled ? (
        <MultiFileDropzone
          value={files}
          onChange={setFiles}
          onFilesAdded={onFilesAdded}
          dropzoneOptions={{ accept: ACCEPT }}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
