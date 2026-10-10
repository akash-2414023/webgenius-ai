import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProjectVersion extends Document {
  projectId: Types.ObjectId;
  versionNumber: number;
  fullCode: string;
  modificationPrompt: string;
  summary?: string;
  createdAt: Date;
}

const ProjectVersionSchema = new Schema<IProjectVersion>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    fullCode: {
      type: String,
      required: true,
    },
    modificationPrompt: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ProjectVersionSchema.index({ projectId: 1, versionNumber: -1 });

export const ProjectVersion = mongoose.model<IProjectVersion>('ProjectVersion', ProjectVersionSchema);
