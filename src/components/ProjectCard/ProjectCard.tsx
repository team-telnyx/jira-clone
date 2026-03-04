import { Link } from 'react-router-dom'
import type { Project } from '../../types/project'
import './ProjectCard.css'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/projects/${project.id}/board`}
      className="project-card"
      data-testid="project-card"
    >
      <div className="project-card-header">
        <span className="project-prefix">{project.prefix}</span>
      </div>
      <h3 className="project-name">{project.name}</h3>
      {project.description && (
        <p
          className="project-description truncated"
          data-testid="project-description"
        >
          {project.description}
        </p>
      )}
    </Link>
  )
}
