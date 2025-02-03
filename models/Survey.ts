import mongoose, { Document, Schema } from "mongoose";

export interface ISurvey extends Document {
  title: string;
  creator: mongoose.Types.ObjectId;
  questions: {
    text: string;
    type: "text" | "multipleChoice";
    options?: string[];
  }[];
  responses: {
    userId: mongoose.Types.ObjectId;
    answers: {
      questionIndex: number;
      answer: string;
    }[];
    submittedAt: Date;
  }[];
}

const SurveySchema = new Schema(
  {
    title: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questions: [
      {
        text: String,
        type: { type: String, enum: ["text", "multipleChoice"] },
        options: {
          type: [String],
          required: function (this: { type: string }) {
            return this.type === "multipleChoice";
          },
        },
      },
    ],
    responses: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        answers: [
          {
            questionIndex: { type: Number, required: true },
            answer: { type: String, required: true },
          },
        ],
        submittedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Survey = mongoose.model<ISurvey>("survey", SurveySchema);

export default Survey;
