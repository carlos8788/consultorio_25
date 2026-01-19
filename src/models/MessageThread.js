import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  author: {
    userId: { type: String, trim: true, default: null },
    role: { type: String, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true }
  },
  body: { type: String, trim: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now }
}, {
  _id: true,
  versionKey: false
});

const messageThreadSchema = new Schema({
  subject: { type: String, trim: true, maxlength: 200 },
  category: {
    type: String,
    enum: ['mensaje', 'idea', 'demo'],
    default: 'mensaje'
  },
  channel: {
    type: String,
    enum: ['app', 'landing', 'plataforma'],
    default: 'app'
  },
  ownerUser: { type: String, trim: true, default: null },
  ownerName: { type: String, trim: true },
  ownerEmail: { type: String, trim: true },
  ownerPhone: { type: String, trim: true },
  status: {
    type: String,
    enum: ['abierto', 'cerrado'],
    default: 'abierto'
  },
  readBy: [{ type: String, trim: true }],
  participants: [{ type: String, trim: true }],
  hiddenBy: [{ type: String, trim: true }],
  messages: [messageSchema],
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  versionKey: false
});

messageThreadSchema.index({ updatedAt: -1 });
messageThreadSchema.index({ category: 1, status: 1 });
messageThreadSchema.index({ ownerUser: 1, updatedAt: -1 });
messageThreadSchema.index({ participants: 1, updatedAt: -1 });

const MessageThread = model('MessageThread', messageThreadSchema);

export default MessageThread;
