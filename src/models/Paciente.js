import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const pacienteSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true
  },
  observaciones: {
    type: [{
      professional: {
        type: Schema.Types.ObjectId,
        ref: 'Professional',
        required: true
      },
      observacion: {
        type: String,
        trim: true,
        maxlength: 500
      }
    }],
    default: []
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  obraSocial: {
    type: Schema.Types.ObjectId,
    ref: 'ObraSocial'
  },
  dni: {
    type: String,
    required: [true, 'El DNI es obligatorio'],
    unique: true,
    trim: true
  },
  edad: {
    type: String,
    trim: true
  },
  fechaNacimiento: {
    type: String,
    default: '2024-01-01'
  },
  // Nuevo esquema: profesional principal
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'Professional'
  },
  // Compatibilidad: médicos adicionales como profesionales
  professionals: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Professional'
    }],
    default: []
  },
  // Compatibilidad legacy (doctor / doctores) - pendiente de migrar a professional
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Professional'
  },
  doctores: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Professional'
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

// Plugin de paginación
pacienteSchema.plugin(mongoosePaginate);

// Índices
// pacienteSchema.index({ dni: 1 });
pacienteSchema.index({ apellido: 1, nombre: 1 });
pacienteSchema.index({ professional: 1 });
pacienteSchema.index({ professionals: 1 });
pacienteSchema.index({ doctor: 1 }); // legacy
pacienteSchema.index({ doctores: 1 }); // legacy
pacienteSchema.index({ deletedAt: 1 });

// Virtual para nombre completo
pacienteSchema.virtual('nombreCompleto').get(function() {
  return `${this.apellido}, ${this.nombre}`;
});

// Configurar para incluir virtuals en JSON
pacienteSchema.set('toJSON', { virtuals: true });
pacienteSchema.set('toObject', { virtuals: true });

const Paciente = model('Paciente', pacienteSchema, 'pacientes');

export default Paciente;
