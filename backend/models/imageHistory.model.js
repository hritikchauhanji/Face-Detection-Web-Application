import mongoose, { Schema } from "mongoose";

const imageHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    facesDetected: {
      type: Number,
      default: 0,
    },
    detectionData: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const ImageHistory = mongoose.model("ImageHistory", imageHistorySchema);
