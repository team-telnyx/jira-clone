import { useEffect, useState, useCallback } from 'react'
import { ProjectCard } from '../../components/ProjectCard'
import { projectService } from '../../api/projectService'
import type { Project } from '../../types/project'
import './DashboardPage.css'

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.getAll()
      setProjects(data)
    } catch (err) {
      setError('Failed to load projects. Please try again.')
      console.error('Failed to fetch projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner" data-testid="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error" role="alert">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchProjects}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>My Projects</h1>
        {projects.length > 0 && (
          <span className="project-count">{projects.length} projects</span>
        )}
      </header>

      {projects.length === 0 ? (
        <div className="dashboard-empty">
          <h2>No projects found</h2>
          <p>Get started by creating your first project.</p>
        </div>
      ) : (
        <div className="projects-grid" data-testid="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
