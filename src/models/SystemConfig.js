import { Schema, model } from 'mongoose';

const systemConfigSchema = new Schema({
  key: {
    type: String,
    default: 'default',
    unique: true,
    trim: true
  },
  clinic: {
    nombre: { type: String, trim: true, default: 'Consultorio' },
    telefono: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    direccion: { type: String, trim: true, default: '' },
    ciudad: { type: String, trim: true, default: '' },
    provincia: { type: String, trim: true, default: '' }
  },
  timezone: {
    type: String,
    trim: true,
    default: 'America/Argentina/Buenos_Aires'
  },
  notifications: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  versionKey: false
});

systemConfigSchema.index({ key: 1 }, { unique: true });

const SystemConfig = model('SystemConfig', systemConfigSchema);

export default SystemConfig;
