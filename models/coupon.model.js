import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    coupon: { type: String, required: true, trim: true,
    lowercase: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
