import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import issueRoutes from './routes/issueRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import * as ProjectModel from './models/Project.js';
import * as IssueModel from './models/Issue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/dashboard', (_req, res) => {
  const projects = ProjectModel.getAllProjects();
  
  const projectsWithCount = projects.map(project => {
    const result = IssueModel.listIssuesByProject(project.id, {}, { page: 1, limit: 1 });
    return {
      ...project,
      issueCount: result.total,
    };
  });
  
  res.render('dashboard', { projects: projectsWithCount });
});

app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/issues', issueRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
