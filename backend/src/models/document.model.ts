/**
 * @module models/document
 * @description Mongoose schema and model for collaborative note documents.
 * Each document represents a single shareable note with access-control flags.
 */

import { Schema, model, Document } from "mongoose";

/** Represents a note document stored in the "notes" collection. */
export interface IDocument extends Document {
  _id: string;
  data: unknown;
  ownerId?: string;
  title: string;
  isPrivate: boolean;
  isReadOnly: boolean;
  isLocked: boolean;
}

const documentSchema = new Schema<IDocument>(
  {
    _id: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: "" },
    ownerId: { type: String, default: null },
    title: { type: String, default: "Untitled" },
    isPrivate: { type: Boolean, default: false },
    isReadOnly: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const DocumentModel = model<IDocument>(
  "Document",
  documentSchema,
  "notes",
);
