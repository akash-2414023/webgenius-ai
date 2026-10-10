import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProjectCurrentCode {
  fullCode: string;
  html: string;
  css: string;
  js: string;
  summary: string;
  palette?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  features: string[];
}

export interface IProject extends Document {
  owner: Types.ObjectId;
  name: string;
  originalPrompt: string;
  currentCode: IProjectCurrentCode;
  versionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot exceed 120 characters'],
    },
    originalPrompt: {
      type: String,
      required: [true, 'Original generation prompt is required'],
    },
    currentCode: {
      fullCode: { type: String, required: true },
      html: { type: String, default: '' },
      css: { type: String, default: '' },
      js: { type: String, default: '' },
      summary: { type: String, default: '' },
      palette: {
        primary: { type: String, default: '#3b82f6' },
        secondary: { type: String, default: '#10b981' },
        background: { type: String, default: '#ffffff' },
        text: { type: String, default: '#0f172a' },
      },
      features: { type: [String], default: [] },
    },
    versionCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ owner: 1, updatedAt: -1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
