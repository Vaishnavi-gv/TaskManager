import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

projectSchema.index({ name: 'text', description: 'text' });
projectSchema.index({ 'members.user': 1 });

export const Project = mongoose.model('Project', projectSchema);
