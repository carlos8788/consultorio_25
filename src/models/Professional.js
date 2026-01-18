import { Schema, model } from 'mongoose';

const professionalSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    select: false
  },
  passwordUpdatedAt: {
    type: Date
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del profesional es obligatorio'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido del profesional es obligatorio'],
    trim: true
  },
  especialidad: {
    type: String,
    trim: true,
    default: 'Clínica General'
  },
  matricula: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  obrasSociales: {
    type: [{
      obraSocial: {
        type: Schema.Types.ObjectId,
        ref: 'ObraSocial',
        required: true
      },
      estado: {
        type: String,
        enum: ['activa', 'suspendida'],
        default: 'activa'
      }
    }],
    default: []
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

professionalSchema.index({ matricula: 1 });
professionalSchema.index({ deletedAt: 1 });

const Professional = model('Professional', professionalSchema, 'professionals');

export default Professional;
