import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const avisoPacienteSchema = new Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  motivo: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['licencia', 'reprogramacion', 'seguimiento', 'general', 'otro'],
    default: 'general'
  },
  canal: {
    type: String,
    enum: ['sin_definir', 'whatsapp', 'llamada', 'email', 'sms', 'otro'],
    default: 'sin_definir'
  },
  prioridad: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'media'
  },
  fechaProgramada: {
    type: Date,
    default: null
  },
  estado: {
    type: String,
    enum: ['pendiente', 'programado', 'completado', 'cancelado'],
    default: 'pendiente'
  },
  paciente: {
    type: Schema.Types.ObjectId,
    ref: 'Paciente',
    default: null
  },
  pacienteNombre: {
    type: String,
    trim: true
  },
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'Professional',
    default: null
  },
  telefono: {
    type: String,
    trim: true,
    default: null
  },
  notas: {
    type: String,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  versionKey: false
});

avisoPacienteSchema.index({ professional: 1, fechaProgramada: 1 });
avisoPacienteSchema.index({ estado: 1 });

avisoPacienteSchema.plugin(mongoosePaginate);

const AvisoPaciente = model('AvisoPaciente', avisoPacienteSchema);

export default AvisoPaciente;
