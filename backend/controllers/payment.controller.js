import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import dotenv from "dotenv";

dotenv.config();

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid products" });
    }

    let totalAmount = 0;
    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); //Stripe wants it in cents
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
      };
    });
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id,
        couponCode: couponCode || "",
      },
    });
    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }
    res
      .status(200)
      .json({ sessionId: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { session_id } = req.body;
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          {
            isActive: false,
          }
        );
      }
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        userId: session.metadata.userId,
        products: products.map((item) => ({
          product: item.id,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: session.amount_total / 100,
        paymentStatus: "paid",
        paymentMethod: "stripe",
        couponCode: session.metadata.couponCode,
        stripeSessionId: session_id,
      });
      await newOrder.save();
      res
        .status(200)
        .json({ message: "Order placed successfully", orderId: newOrder._id });
    } else {
      res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}

async function createNewCoupon(usreId) {
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId: userId,
  });

  await newCoupon.save();
  return newCoupon;
}
