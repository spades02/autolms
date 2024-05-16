import { auth, currentUser } from '@clerk/nextjs/server';
import { initEdgeStore } from '@edgestore/server';
import { CreateContextOptions, createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';
 
type Context = {
    userId:string | null;
};
async function createContext({req}: CreateContextOptions): Promise<Context> {
    // get the session from your auth provider
    const { userId } = auth();
    
    return {
        userId: userId,
    };
}

const es = initEdgeStore.context<Context>().create();
 
/**
 * This is the main router for the Edge Store buckets.
 */
const edgeStoreRouter = es.router({
  protectedFiles: es
  .fileBucket({
    // maxSize: 1024 * 1024 * 10, // 10MB
    accept: ['video/mkv', 'video/mp4'], // wildcard also works: ['image/*']
  })
  .path(({ ctx }) => [{owner:ctx.userId}])
  .accessControl({
    OR:[
        {
            userId: {path: "owner"},
        }
    ]
  })
  .beforeUpload(({ ctx, input, fileInfo }) => {
      console.log('beforeUpload', ctx, input, fileInfo);
      return true; // allow upload
    })
   .beforeDelete(({ ctx, fileInfo }) => {
      console.log('beforeDelete', ctx, fileInfo);
      return true; // allow delete
    }),
});
 
const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
  createContext,
});
 
export { handler as GET, handler as POST };
 
/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;