/* eslint-disable @typescript-eslint/no-explicit-any -- checkout attempts are hydrated dynamic documents. */
import { CheckoutAttempt, Product } from "../models";
import { logger } from "../utils/logger";

export async function releaseAttempt(attempt: any) {
  await Product.updateMany({ "stockReservations.attemptId": attempt._id }, [
    {
      $set: {
        stockQuantity: {
          $add: [
            "$stockQuantity",
            {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$stockReservations",
                      as: "r",
                      cond: { $eq: ["$$r.attemptId", attempt._id] },
                    },
                  },
                  as: "r",
                  in: "$$r.quantity",
                },
              },
            },
          ],
        },
        stockReservations: {
          $filter: {
            input: "$stockReservations",
            as: "r",
            cond: { $ne: ["$$r.attemptId", attempt._id] },
          },
        },
      },
    },
  ]);
  attempt.status = "ROLLED_BACK";
  await attempt.save();
}
export async function recoverStaleCheckouts() {
  const stale = await CheckoutAttempt.find({
    status: "RESERVING",
    expiresAt: { $lt: new Date() },
  });
  for (const attempt of stale) {
    try {
      await releaseAttempt(attempt);
    } catch (error) {
      logger.error(
        { err: error, attemptId: attempt.id },
        "Checkout recovery failed",
      );
    }
  }
  if (stale.length)
    logger.warn(
      { recovered: stale.length },
      "Recovered stale checkout attempts",
    );
}
