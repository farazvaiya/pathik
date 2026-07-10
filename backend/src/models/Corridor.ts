import mongoose, { Schema } from 'mongoose';

const DirectSchema = new Schema(
  {
    mode: { type: String, required: true },
    names: { type: [String], default: [] },
    stops: { type: [String], default: [] },
    fare: { type: Number, required: false },
  },
  { _id: false }
);

const CorridorSchema = new Schema(
  {
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    direct: { type: DirectSchema, required: true },
  },
  { timestamps: true }
);

CorridorSchema.index({ from: 1, to: 1 }, { unique: true });

export const Corridor = mongoose.model('Corridor', CorridorSchema);
