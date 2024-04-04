import { initEdgeStore } from '@edgestore/server';
import { CreateContextOptions, createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';
 
type Context = {
    userId:string;
    userRole: "admin" | "user";
};
function createContext({req}: CreateContextOptions): Context {
    // get the session from your auth provider
    // const session = getSession(req);
    return {
        userId: "123",
        userRole: "admin",
    };
}

const es = initEdgeStore.context<Context>().create();
 
/**
 * This is the main router for the Edge Store buckets.
 */
const edgeStoreRouter = es.router({
  protectedFiles: es.
  fileBucket()
  .path(({ ctx }) => [{owner:ctx.userId}])
  .accessControl({
    OR:[
        {
            userId: {path: "owner"},
        },
        {
            userRole: "admin",
        }
    ]
  })
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