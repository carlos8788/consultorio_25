import { Schema, model } from 'mongoose';

const subscriptionSchema = new Schema({
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'Professional',
    required: false
  },
  plan: {
    type: String,
    enum: ['mensual', 'anual'],
    required: true
  },
  status: {
    type: String,
    enum: ['activa', 'pendiente', 'vencida', 'cancelada'],
    default: 'pendiente'
  },
  monto: {
    type: Number,
    default: 0
  },
  moneda: {
    type: String,
    default: 'ARS'
  },
  inicio: {
    type: Date,
    default: Date.now
  },
  fin: {
    type: Date
  },
  proximoCobro: {
    type: Date
  },
  autoRenovar: {
    type: Boolean,
    default: true
  },
  notas: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

subscriptionSchema.index({ professional: 1, status: 1 });
subscriptionSchema.index({ proximoCobro: 1 });

const Subscription = model('Subscription', subscriptionSchema);

export default Subscription;
