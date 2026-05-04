import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, default: '', maxlength: 5000 },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done', 'blocked'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: { type: Date, default: null },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);
