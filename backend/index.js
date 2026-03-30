require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./Config/db');
const authRoutes = require('./Routes/authRoutes');
const profileRoutes = require('./Routes/profileRoutes');
const projectRoutes = require('./Routes/projectRoutes');
const matchingRoutes = require('./Routes/matchingRoutes');
const aiideathonRoutes = require('./Routes/aiideathonRoutes'); // AI Ideathon routes
const kaggleRoutes = require('./Routes/kaggleRoutes');         // Kaggle dataset search
const githubRoutes = require('./Routes/githubRoutes');         // GitHub repo search
const invitationRoutes = require('./Routes/invitationRoutes'); // Team invitations
const taskRoutes = require('./Routes/taskRoutes');             // Workspace tasks
const githubIntegrationRoutes = require('./Routes/githubIntegrationRoutes'); // GitHub integration (branches/commits/PRs)
const activityRoutes = require('./Routes/activityRoutes');     // Activity feed

const http = require('http');
const { Server } = require('socket.io');

// ─── Connect to MongoDB ─────────────────────────────────
connectDB();

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ─────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log('A user connected via socket.io:', socket.id);

  socket.on('join_task', (taskId) => {
    socket.join(taskId);
    console.log(`Socket ${socket.id} joined task room: ${taskId}`);
  });

  socket.on('leave_task', (taskId) => {
    socket.leave(taskId);
    console.log(`Socket ${socket.id} left task room: ${taskId}`);
  });

  socket.on('join_project', (projectId) => {
    const roomName = `project_${projectId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined project room: ${roomName}`);
  });

  socket.on('leave_project', (projectId) => {
    const roomName = `project_${projectId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left project room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to our routes
app.set('io', io);

// ─── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/aiideathon', aiideathonRoutes); // AI Ideathon routes
app.use('/api/kaggle', kaggleRoutes);
app.use('/api/github', githubRoutes);        // GitHub integration
app.use('/api/invitations', invitationRoutes); // Team invitations
app.use('/api/tasks', taskRoutes);           // Workspace tasks
app.use('/api/github-integration', githubIntegrationRoutes); // GitHub integration
app.use('/api/activities', activityRoutes);         // Activity feed

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CampusConnector API running' });
});

// ─── Start server ───────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
