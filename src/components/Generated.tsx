"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MdOutlineContentCopy, MdOutlineFileDownload } from "react-icons/md";
import { FaEdit, FaCheck } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
};

export function DrawerDialogDemo(props: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-full w-full">
          {props.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-w-[500px]">
        <ResourceView title={props.title} content={props.content} />
      </DialogContent>
    </Dialog>
  );
}

function ResourceView({ title, content }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("copy failed", err);
    }
  };

  const download = () => {
    const blob = new Blob([draft], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-row gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copy}
              title="Copy"
            >
              {copied ? <FaCheck /> : <MdOutlineContentCopy />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={download}
              title="Download"
            >
              <MdOutlineFileDownload />
            </Button>
            <Button
              type="button"
              variant={editing ? "default" : "outline"}
              size="icon"
              onClick={() => setEditing((e) => !e)}
              title={editing ? "Done editing" : "Edit"}
            >
              {editing ? <FaCheck /> : <FaEdit />}
            </Button>
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-y-auto h-96 w-full">
        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-full min-h-96 w-full font-mono text-sm"
          />
        ) : (
          <article className="prose prose-sm dark:prose-invert max-w-none px-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
          </article>
        )}
      </div>
    </>
  );
}
