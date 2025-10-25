import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const turnoSchema = new Schema({
  paciente: {
    type: Schema.Types.Mixed,
    ref: 'User',
    required: false
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
    type: String,
    required: [true, 'La fecha es obligatoria'],
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'cancelado', 'completado'],
    default: 'pendiente'
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

const Turno = model('Turno', turnoSchema);

export default Turno;
