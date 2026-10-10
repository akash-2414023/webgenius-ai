import { Router } from 'express';
import { handleGenerate, handleRefine } from '../controllers/generationController.js';
import { handleGetConfigStatus, handleSaveApiKey, handleSaveMongoUri } from '../controllers/configController.js';
import { 
  handleRegister, 
  handleLogin, 
  handleLogout, 
  handleGetMe, 
  handleUpdateProfile, 
  handleForgotPassword, 
  handleResetPassword 
} from '../controllers/authController.js';
import { 
  handleCreateProject, 
  handleListProjects, 
  handleGetProject, 
  handleUpdateProject, 
  handleRenameProject, 
  handleDeleteProject, 
  handleListVersions, 
  handleRestoreVersion 
} from '../controllers/projectController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { authRateLimiter, aiRateLimiter } from '../middleware/rateLimiter.js';
import { getDatabaseStatus } from '../db/connection.js';

const router = Router();

// Safe health check (does not expose credentials)
router.get('/health', (_req, res) => {
  const dbStatus = getDatabaseStatus();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'WebGenius AI API',
    database: {
      isConfigured: dbStatus.isConfigured,
      isConnected: dbStatus.isConnected,
      dbName: dbStatus.dbName,
    },
  });
});

// Config & Setup status
router.get('/config-status', handleGetConfigStatus);
router.post('/config-key', handleSaveApiKey);
router.post('/config-mongo', handleSaveMongoUri);

// User Authentication
router.post('/auth/register', authRateLimiter, handleRegister);
router.post('/auth/login', authRateLimiter, handleLogin);
router.post('/auth/logout', handleLogout);
router.get('/auth/me', requireAuth, handleGetMe);
router.put('/auth/profile', requireAuth, handleUpdateProfile);
router.post('/auth/forgot-password', authRateLimiter, handleForgotPassword);
router.post('/auth/reset-password', authRateLimiter, handleResetPassword);

// Projects & Persistence
router.post('/projects', requireAuth, handleCreateProject);
router.get('/projects', requireAuth, handleListProjects);
router.get('/projects/:id', requireAuth, handleGetProject);
router.put('/projects/:id', requireAuth, handleUpdateProject);
router.patch('/projects/:id/rename', requireAuth, handleRenameProject);
router.delete('/projects/:id', requireAuth, handleDeleteProject);
router.get('/projects/:id/versions', requireAuth, handleListVersions);
router.post('/projects/:id/versions/:versionId/restore', requireAuth, handleRestoreVersion);

// AI Website generation endpoints
router.post('/generate', aiRateLimiter, optionalAuth, handleGenerate);
router.post('/refine', aiRateLimiter, optionalAuth, handleRefine);

export default router;
