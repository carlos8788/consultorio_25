import { Schema, model } from 'mongoose';

const interesadoSchema = new Schema({
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'Professional',
    required: false,
    index: true
  },
  paciente: {
    type: Schema.Types.ObjectId,
    ref: 'Paciente',
    index: true
  },
  nombre: {
    type: String,
    trim: true
  },
  apellido: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  comentario: {
    type: String,
    trim: true
  },
  origen: {
    type: String,
    trim: true,
    default: 'licencia'
  },
  estado: {
    type: String,
    enum: ['pendiente', 'notificado'],
    default: 'pendiente'
  }
}, {
  timestamps: true,
  versionKey: false
});

interesadoSchema.index({ professional: 1, paciente: 1 });

const InteresadoNotificacion = model('InteresadoNotificacion', interesadoSchema);

export default InteresadoNotificacion;
