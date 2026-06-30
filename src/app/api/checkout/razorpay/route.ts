import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay client. If keys are missing, we log it and operate in mock mode.
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay = keyId && keySecret 
  ? new Razorpay({ key_id: keyId, key_secret: keySecret })
  : null;

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    // Mock Mode if Razorpay is not configured
    if (!razorpay) {
      console.warn("Razorpay keys are missing. Operating in MOCK checkout mode.");
      return NextResponse.json({
        mock: true,
        id: "mock_order_" + Math.random().toString(36).substring(2, 9),
        amount: amount * 100,
        currency: "INR",
      });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
