import { useState } from 'react'
import { IssueModal } from './components'
import type { Issue } from './types/issue'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | undefined>(undefined)

  const handleCreateClick = () => {
    setEditingIssue(undefined)
    setIsModalOpen(true)
  }

  const handleSuccess = (issue: Issue) => {
    console.log('Issue saved:', issue)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingIssue(undefined)
  }

  return (
    <div className="app-container">
      <h1>Jira Clone</h1>
      <button
        className="btn btn-primary open-modal-btn"
        onClick={handleCreateClick}
      >
        Create Issue
      </button>
      
      <IssueModal
        isOpen={isModalOpen}
        onClose={handleClose}
        issue={editingIssue}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default App
