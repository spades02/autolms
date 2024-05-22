import { getUserprojects } from "@/actions/project.action";
import { getUserById } from "@/actions/user.action";
import ProjectCard from "@/components/ProjectCard";
import Topbar from "@/components/ui/Topbar";
import { Button } from "@/components/ui/button";
import { IProject } from "@/database/projects.model";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";



const ProjectList = async() => {
 const { userId } = auth();

 if (!userId) redirect("/sign-in");

 const user = await getUserById(userId);
 const projects = await getUserprojects(user._id);

  return (
    <div>
      <Topbar />
      <div className="m-8">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Saved Projects
        </h1>
        {projects && projects.length > 0 ? (
          projects.map((project: IProject) => (
            <div
              key={project._id}
              className="grid self-center place-items-center align-middle m-5"
            >
              <div>
                <Link href={`/project/${project._id}`}>
                  <Button variant={"outline"} className="h-48 w-48">
                    {project.title}
                  </Button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div>No projects Found</div>
        )}
      </div>
    </div>
  );
}


export default ProjectList