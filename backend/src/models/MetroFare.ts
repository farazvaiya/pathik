import mongoose, { Schema, Document } from 'mongoose';

export interface IMetroFare extends Document {
  from: string;
  to: string;
  fare: number;
}

const MetroFareSchema = new Schema<IMetroFare>(
  {
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    fare: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

MetroFareSchema.index({ from: 1, to: 1 }, { unique: true });

export const MetroFare = mongoose.model<IMetroFare>('MetroFare', MetroFareSchema);
