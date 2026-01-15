import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const turnoSchema = new Schema({
  paciente: {
    type: Schema.Types.ObjectId,
    ref: 'Paciente',
    required: false,
    default: null
  },
  observacionesTurno: {
    type: String,
    trim: true
  },
  diagnostico: {
    type: String,
    trim: true
  },
  hora: {
    type: String,
    required: [true, 'La hora es obligatoria'],
    trim: true
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha es obligatoria']
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'cancelado', 'completado'],
    default: 'pendiente'
  },
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'Professional'
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
turnoSchema.plugin(mongoosePaginate);

// Índices
turnoSchema.index({ fecha: 1, hora: 1 });
turnoSchema.index({ paciente: 1 });
turnoSchema.index({ professional: 1 });
turnoSchema.index({ deletedAt: 1 });

const Turno = model('Turno', turnoSchema);

export default Turno;
