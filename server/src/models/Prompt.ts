import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const promptSchema = new Schema(
  {
    phrase: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Animals", "Household", "Machines", "Absurd"],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
    },
    acceptedSynonyms: { type: [String], default: [] },
    language: { type: String, required: true, enum: ["en", "fa"], default: "en" },
  },
  { timestamps: true },
);

export type PromptDocument = InferSchemaType<typeof promptSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type PromptPayload = {
  phrase: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  acceptedSynonyms: string[];
  language: "en" | "fa";
};

export const Prompt: Model<PromptDocument> =
  mongoose.models.Prompt ?? mongoose.model<PromptDocument>("Prompt", promptSchema);
