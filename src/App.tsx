import { KanbanBoard } from './components';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Jira Clone</h1>
      </header>
      <main>
        <KanbanBoard />
      </main>
    </div>
  );
}

export default App;
