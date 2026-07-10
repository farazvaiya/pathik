import mongoose, { Schema, Document } from 'mongoose';

export interface IBusFare extends Document {
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  totalDistanceKm: number;
  fareRatePerKm: number;
  stations: string[];
}

const BusFareSchema = new Schema<IBusFare>(
  {
    routeId: { type: String, required: true, unique: true, index: true },
    routeName: { type: String, required: true },
    origin: { type: String, required: true, index: true },
    destination: { type: String, required: true, index: true },
    totalDistanceKm: { type: Number, required: true, min: 0 },
    fareRatePerKm: { type: Number, required: true, min: 0 },
    stations: { type: [String], default: [] },
  },
  { timestamps: true }
);

BusFareSchema.index({ routeName: 'text', origin: 'text', destination: 'text' });

export const BusFare = mongoose.model<IBusFare>('BusFare', BusFareSchema);
