
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./Config/db');

const authRoutes = require('./Routes/authRoutes');
const profileRoutes = require('./Routes/profileRoutes');
const projectRoutes = require('./Routes/projectRoutes');
const matchingRoutes = require('./Routes/matchingRoutes');
const aiideathonRoutes = require('./Routes/aiideathonRoutes');
const kaggleRoutes = require('./Routes/kaggleRoutes');
const githubRoutes = require('./Routes/githubRoutes');
const invitationRoutes = require('./Routes/invitationRoutes');
const taskRoutes = require('./Routes/taskRoutes');
const githubIntegrationRoutes = require('./Routes/githubIntegrationRoutes');
const activityRoutes = require('./Routes/activityRoutes');

const http = require('http');
const { Server } = require('socket.io');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://project-frontend-m3s5.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }
});

// Socket.io events
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

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/aiideathon', aiideathonRoutes);
app.use('/api/kaggle', kaggleRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/github-integration', githubIntegrationRoutes);
app.use('/api/activities', activityRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CampusConnector API running'
  });
});

// Start server only after MongoDB connects
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
