import { Response } from 'express';
import { Project } from '../models/Project.js';
import { ProjectVersion } from '../models/ProjectVersion.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isDatabaseConnected } from '../db/connection.js';

export async function handleCreateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      res.status(503).json({
        success: false,
        error: 'Database is not connected. Please configure MongoDB Atlas.',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const { name, originalPrompt, currentCode } = req.body;

    if (!originalPrompt || !currentCode || !currentCode.fullCode) {
      res.status(400).json({
        success: false,
        error: 'Website code and original prompt are required to save a project.',
      });
      return;
    }

    const projectName = (name && typeof name === 'string' && name.trim().length > 0)
      ? name.trim()
      : currentCode.title || 'Untitled Website';

    const project = await Project.create({
      owner: req.user._id,
      name: projectName,
      originalPrompt: originalPrompt.trim(),
      currentCode: {
        fullCode: currentCode.fullCode,
        html: currentCode.html || '',
        css: currentCode.css || '',
        js: currentCode.js || '',
        summary: currentCode.summary || '',
        palette: currentCode.palette || {
          primary: '#3b82f6',
          secondary: '#10b981',
          background: '#ffffff',
          text: '#0f172a',
        },
        features: Array.isArray(currentCode.features) ? currentCode.features : [],
      },
      versionCount: 1,
    });

    // Create Initial Version #1
    await ProjectVersion.create({
      projectId: project._id,
      versionNumber: 1,
      fullCode: currentCode.fullCode,
      modificationPrompt: 'Initial Generation',
      summary: currentCode.summary || 'Initial creation',
    });

    res.status(201).json({
      success: true,
      message: 'Project saved successfully.',
      data: project,
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save project. Please try again.',
    });
  }
}

export async function handleListProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      res.status(503).json({
        success: false,
        error: 'Database connection offline.',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const searchQuery = req.query.search as string;
    const filter: any = { owner: req.user._id };

    if (searchQuery && searchQuery.trim().length > 0) {
      const regex = new RegExp(searchQuery.trim(), 'i');
      filter.$or = [{ name: regex }, { originalPrompt: regex }];
    }

    const projects = await Project.find(filter)
      .sort({ updatedAt: -1 })
      .select('-currentCode.fullCode'); // Exclude heavy code from list view for fast loading

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    console.error('List projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve projects.',
    });
  }
}

export async function handleGetProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      res.status(503).json({ success: false, error: 'Database connection offline.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found or you do not have permission to view it.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project details.',
    });
  }
}

export async function handleUpdateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      res.status(503).json({ success: false, error: 'Database connection offline.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found or access denied.',
      });
      return;
    }

    const { name, currentCode, modificationPrompt } = req.body;

    if (name && typeof name === 'string') {
      project.name = name.trim();
    }

    if (currentCode && currentCode.fullCode) {
      const codeChanged = project.currentCode.fullCode !== currentCode.fullCode;

      project.currentCode = {
        fullCode: currentCode.fullCode,
        html: currentCode.html ?? project.currentCode.html,
        css: currentCode.css ?? project.currentCode.css,
        js: currentCode.js ?? project.currentCode.js,
        summary: currentCode.summary ?? project.currentCode.summary,
        palette: currentCode.palette ?? project.currentCode.palette,
        features: currentCode.features ?? project.currentCode.features,
      };

      if (codeChanged) {
        project.versionCount = (project.versionCount || 1) + 1;
        await ProjectVersion.create({
          projectId: project._id,
          versionNumber: project.versionCount,
          fullCode: currentCode.fullCode,
          modificationPrompt: modificationPrompt || 'Manual / AI Edit',
          summary: currentCode.summary || '',
        });
      }
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: project,
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project.',
    });
  }
}

export async function handleRenameProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected() || !req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized or database offline.' });
      return;
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Project name is required.' });
      return;
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name: name.trim() },
      { new: true }
    );

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project renamed successfully.',
      data: project,
    });
  } catch (error: any) {
    console.error('Rename project error:', error);
    res.status(500).json({ success: false, error: 'Failed to rename project.' });
  }
}

export async function handleDeleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected() || !req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized or database offline.' });
      return;
    }

    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found or access denied.',
      });
      return;
    }

    // Clean up all versions
    await ProjectVersion.deleteMany({ projectId: project._id });

    res.status(200).json({
      success: true,
      message: 'Project and all version history deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project.' });
  }
}

export async function handleListVersions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected() || !req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized or database offline.' });
      return;
    }

    // Verify ownership
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found.' });
      return;
    }

    const versions = await ProjectVersion.find({ projectId: project._id })
      .sort({ versionNumber: -1 })
      .select('-fullCode'); // Omit full code in summary list

    res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (error: any) {
    console.error('List versions error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve project versions.' });
  }
}

export async function handleRestoreVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected() || !req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized or database offline.' });
      return;
    }

    const { versionId } = req.params;

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found.' });
      return;
    }

    const version = await ProjectVersion.findOne({
      _id: versionId,
      projectId: project._id,
    });

    if (!version) {
      res.status(404).json({ success: false, error: 'Version not found.' });
      return;
    }

    // Update project with the restored version
    project.currentCode.fullCode = version.fullCode;
    project.versionCount = (project.versionCount || 1) + 1;

    await ProjectVersion.create({
      projectId: project._id,
      versionNumber: project.versionCount,
      fullCode: version.fullCode,
      modificationPrompt: `Restored Version #${version.versionNumber}`,
      summary: version.summary || 'Restored snapshot',
    });

    await project.save();

    res.status(200).json({
      success: true,
      message: `Restored to Version #${version.versionNumber}.`,
      data: project,
    });
  } catch (error: any) {
    console.error('Restore version error:', error);
    res.status(500).json({ success: false, error: 'Failed to restore project version.' });
  }
}
