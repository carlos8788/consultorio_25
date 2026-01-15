import { Schema, model } from 'mongoose';

const demoRequestSchema = new Schema({
  nombre: {
    type: String,
    trim: true,
    required: true,
    maxlength: 120
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
    maxlength: 160
  },
  telefono: {
    type: String,
    trim: true,
    required: true,
    maxlength: 40
  },
  ip: {
    type: String,
    trim: true,
    maxlength: 80
  },
  centro: {
    type: String,
    trim: true,
    maxlength: 120
  },
  mensaje: {
    type: String,
    trim: true,
    maxlength: 800
  },
  intent: {
    type: String,
    enum: ['demo', 'trial'],
    default: 'demo'
  },
  source: {
    type: String,
    trim: true,
    default: 'landing'
  },
  estado: {
    type: String,
    enum: ['nuevo', 'contactado', 'cerrado'],
    default: 'nuevo'
  }
}, {
  timestamps: true,
  versionKey: false
});

demoRequestSchema.index({ createdAt: -1 });
demoRequestSchema.index({ email: 1, createdAt: -1 });
demoRequestSchema.index({ ip: 1, createdAt: -1 });
demoRequestSchema.index({ ip: 1, estado: 1 });

const DemoRequest = model('DemoRequest', demoRequestSchema);

export default DemoRequest;
