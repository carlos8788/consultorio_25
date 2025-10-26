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
    type: String,
    trim: true
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
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Plugin de paginación
pacienteSchema.plugin(mongoosePaginate);

// Índices
pacienteSchema.index({ dni: 1 });
pacienteSchema.index({ apellido: 1, nombre: 1 });
pacienteSchema.index({ doctor: 1 });

// Virtual para nombre completo
pacienteSchema.virtual('nombreCompleto').get(function() {
  return `${this.apellido}, ${this.nombre}`;
});

// Configurar para incluir virtuals en JSON
pacienteSchema.set('toJSON', { virtuals: true });
pacienteSchema.set('toObject', { virtuals: true });

const Paciente = model('User', pacienteSchema);

export default Paciente;
