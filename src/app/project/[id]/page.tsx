import { getProjectById } from '@/actions/project.action';
import { DrawerDialogDemo } from '@/components/Generated';
import Topbar from '@/components/ui/Topbar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Project = async ({ params }: { params: any }) => {

  const project = await getProjectById({
    projectId: params.id,
  });

  console.log(project)

  return (
    <div>
      <Topbar />

      {project.videoLinks && project.videoLinks.length > 0 && (
        <div className="col-span-2 w-full">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {project.videoLinks.map((url:any, index:any) => (
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
      <div className="m-4 rounded-xl shadow-2xl drop-shadow-2xl">
        <div>
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Generated Resources
          </h1>
        </div>
        <div className="flex flex-row gap-2 m-8 h-28">
          {project.quiz && (
            <div className="w-full">
              <DrawerDialogDemo title="Quiz" content={project.quiz} />
            </div>
          )}
          {project.asgn && (
            <div className="w-full">
              <DrawerDialogDemo title="Assignment" content={project.asgn} />
            </div>
          )}
          {project.notes && (
            <div className="grid w-full gap-1.5">
              <DrawerDialogDemo title="Lecture Notes" content={project.notes} />
            </div>
          )}
          {project.proj && (
            <div className="grid w-full gap-1.5">
              <DrawerDialogDemo title="Project Idea" content={project.proj} />
            </div>
          )}
          {project.paper && (
            <div className="w-full ">
              <DrawerDialogDemo title="Exam Paper" content={project.paper} />
            </div>
          )}
          {project.summary && (
            <div className="grid w-full gap-1.5">
              <DrawerDialogDemo title="Summary" content={project.summary} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Project