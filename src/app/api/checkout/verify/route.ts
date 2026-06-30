import { NextResponse } from "next/server";
import crypto from "crypto";

const keySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "All signature fields are required" }, { status: 400 });
    }

    // Mock Mode verification
    if (razorpay_order_id.startsWith("mock_order_")) {
      return NextResponse.json({ verified: true, message: "Mock payment verified successfully" });
    }

    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay secret key not configured on server" }, { status: 500 });
    }

    // Standard Razorpay signature verification
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ verified: true, message: "Payment verified successfully" });
    } else {
      return NextResponse.json({ verified: false, error: "Invalid signature" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
