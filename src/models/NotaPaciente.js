import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const notaPacienteSchema = new Schema({
  paciente: {
    type: Schema.Types.ObjectId,
    ref: 'Paciente',
    default: null
  },
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'Professional',
    required: true
  },
  sharedWith: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Professional'
    }],
    default: []
  },
  titulo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  contenido: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000
  },
  tipo: {
    type: String,
    enum: ['clinica', 'administrativa', 'seguimiento', 'general', 'otro'],
    default: 'general'
  },
  tags: {
    type: [String],
    default: []
  },
  pinned: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    trim: true,
    default: null
  },
  updatedBy: {
    type: String,
    trim: true,
    default: null
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

notaPacienteSchema.plugin(mongoosePaginate);

notaPacienteSchema.index({ paciente: 1, professional: 1, createdAt: -1 });
notaPacienteSchema.index({ tags: 1 });
notaPacienteSchema.index({ pinned: 1 });
notaPacienteSchema.index({ deletedAt: 1 });

const NotaPaciente = model('NotaPaciente', notaPacienteSchema);

export default NotaPaciente;
