import { Schema, models, model, Document } from "mongoose";

export type UserRole = "student" | "faculty" | "admin";

export interface IUser extends Document {
  clerkId: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  picture: string;
  role: UserRole;
  joinedAt: Date;
}

const UserSchema = new Schema({
  clerkId: { type: String, required: true, index: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  picture: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "faculty", "admin"],
    default: "student",
    required: true,
    index: true,
  },
  joinedAt: { type: Date, default: Date.now },
});

const User = models?.User || model("User", UserSchema);

export default User;