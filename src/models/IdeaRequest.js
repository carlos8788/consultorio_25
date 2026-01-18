import mongoose from 'mongoose';

const ideaRequestSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 160 },
    rol: { type: String, trim: true, maxlength: 120 },
    mensaje: { type: String, required: true, trim: true, maxlength: 2000 },
    impacto: { type: String, trim: true, maxlength: 800 },
    source: { type: String, trim: true, maxlength: 40, default: 'plataforma' },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true, maxlength: 240 },
    estado: { type: String, enum: ['nuevo', 'revisado'], default: 'nuevo' }
  },
  { timestamps: true }
);

ideaRequestSchema.index({ email: 1, createdAt: -1 });
ideaRequestSchema.index({ estado: 1, createdAt: -1 });

export default mongoose.model('IdeaRequest', ideaRequestSchema);
