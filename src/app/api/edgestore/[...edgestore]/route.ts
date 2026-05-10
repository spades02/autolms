import { auth } from "@clerk/nextjs/server";
import { initEdgeStore } from "@edgestore/server";
import {
  CreateContextOptions,
  createEdgeStoreNextHandler,
} from "@edgestore/server/adapters/next/app";

type Context = {
  userId: string | null;
};

async function createContext(_opts: CreateContextOptions): Promise<Context> {
  const { userId } = auth();
  return { userId };
}

const es = initEdgeStore.context<Context>().create();

// MIME types accepted by both submissionFiles (student work) and
// assignmentAttachments (faculty reference docs). Phase 6 broadens the list
// from PDF/DOCX to include presentations, spreadsheets, and zips.
const DOCUMENT_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
];

const edgeStoreRouter = es.router({
  publicFiles: es
    .fileBucket({
      accept: ["video/mkv", "video/mp4"],
    })
    .path(({ ctx }) => [{ owner: ctx.userId }])
    .beforeUpload(({ ctx, input, fileInfo }) => {
      console.log("publicFiles upload", ctx, input, fileInfo);
      return true;
    })
    .beforeDelete(({ ctx, fileInfo }) => {
      console.log("publicFiles delete", ctx, fileInfo);
      return true;
    }),
  submissionFiles: es
    .fileBucket({
      accept: DOCUMENT_MIME,
    })
    .path(({ ctx }) => [{ owner: ctx.userId }])
    .beforeUpload(({ ctx, input, fileInfo }) => {
      console.log("submissionFiles upload", ctx, input, fileInfo);
      return true;
    })
    .beforeDelete(({ ctx, fileInfo }) => {
      console.log("submissionFiles delete", ctx, fileInfo);
      return true;
    }),
  assignmentAttachments: es
    .fileBucket({
      accept: DOCUMENT_MIME,
    })
    .path(({ ctx }) => [{ owner: ctx.userId }])
    .beforeUpload(({ ctx, input, fileInfo }) => {
      console.log("assignmentAttachments upload", ctx, input, fileInfo);
      return true;
    })
    .beforeDelete(({ ctx, fileInfo }) => {
      console.log("assignmentAttachments delete", ctx, fileInfo);
      return true;
    }),
});

const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
  createContext,
});

export { handler as GET, handler as POST };

export type EdgeStoreRouter = typeof edgeStoreRouter;
