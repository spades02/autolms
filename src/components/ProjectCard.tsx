"use client";
import Link from 'next/link';
import React from 'react'
import { IProject } from "@/database/projects.model";


const ProjectCard = ({ project }: { project: IProject }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <li
      className="collection-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/project/${project._id}`}>
        <div className="relative">
          
        </div>

        <div className="flex-between pt-3">
          <p className="p-20-semibold mr-3 line-clamp-1 text-dark-600">
            {project.title}
          </p>
          {/* <Image
            src={`/assets/icons/${
              transformationTypes[
                image.transformationType as TransformationTypeKey
              ].icon
            }`}
            alt={image.title}
            width={24}
            height={24}
          /> */}
        </div>
      </Link>
    </li>
  );
};

export default ProjectCard;