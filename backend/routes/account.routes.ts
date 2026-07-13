import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  accountSettingsSchema,
  addressSchema,
  passwordChangeSchema,
} from "../../lib/validation/schemas";
import { AddressModel, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { avatarUpload, publicUploadUrl } from "../middleware/upload";
import { AppError, success } from "../utils/http";
import { mapAddress, mapSessionUser } from "../utils/mappers";

export const accountRouter = Router();
accountRouter.use(requireAuth);
accountRouter.get("/settings", async (req, res) => {
  const user = await User.findById(req.authUser!.id);
  if (!user) throw new AppError(404, "NOT_FOUND", "Account was not found.");
  return success(req, res, {
    user: {
      ...mapSessionUser(user),
      phone: user.phone || "",
      bio: user.bio || "",
      isVerified: user.isVerified,
    },
  });
});
accountRouter.patch("/settings", async (req, res) => {
  const parsed = accountSettingsSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Please enter valid account details.",
    );
  const duplicate = await User.exists({
    _id: { $ne: req.authUser!.id },
    $or: [
      { email: parsed.data.email.toLowerCase() },
      { username: parsed.data.username.toLowerCase() },
      ...(parsed.data.phone ? [{ phone: parsed.data.phone }] : []),
    ],
  });
  if (duplicate)
    throw new AppError(
      409,
      "USER_EXISTS",
      "Email, username, or phone is already in use.",
    );
  const user = await User.findByIdAndUpdate(
    req.authUser!.id,
    {
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      username: parsed.data.username.toLowerCase(),
      phone: parsed.data.phone || undefined,
      bio: parsed.data.bio || undefined,
    },
    { returnDocument: "after", runValidators: true },
  );
  return success(req, res, {
    user: {
      ...mapSessionUser(user),
      phone: user?.phone || "",
      bio: user?.bio || "",
      isVerified: user?.isVerified,
    },
  });
});
accountRouter.get("/addresses", async (req, res) =>
  success(req, res, {
    items: (
      await AddressModel.find({ userId: req.authUser!.id }).sort({
        isDefault: -1,
        createdAt: -1,
      })
    ).map(mapAddress),
  }),
);
accountRouter.post("/addresses", async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Please enter a valid address.",
    );
  const isDefault =
    Boolean(parsed.data.isDefault) ||
    (await AddressModel.countDocuments({ userId: req.authUser!.id })) === 0;
  if (isDefault)
    await AddressModel.updateMany(
      { userId: req.authUser!.id },
      { isDefault: false },
    );
  const item = await AddressModel.create({
    ...parsed.data,
    userId: req.authUser!.id,
    isDefault,
  });
  return success(req, res, mapAddress(item), 201);
});
accountRouter.patch("/addresses/:id/default", async (req, res) => {
  const item = await AddressModel.findOne({
    _id: req.params.id,
    userId: req.authUser!.id,
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Address was not found.");
  await AddressModel.updateMany(
    { userId: req.authUser!.id },
    { isDefault: false },
  );
  item.isDefault = true;
  await item.save();
  return success(req, res, mapAddress(item));
});
accountRouter.patch("/addresses/:id", async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Please enter a valid address.",
    );
  if (parsed.data.isDefault)
    await AddressModel.updateMany(
      { userId: req.authUser!.id },
      { isDefault: false },
    );
  const item = await AddressModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.authUser!.id },
    parsed.data,
    { returnDocument: "after", runValidators: true },
  );
  if (!item) throw new AppError(404, "NOT_FOUND", "Address was not found.");
  return success(req, res, mapAddress(item));
});
accountRouter.delete("/addresses/:id", async (req, res) => {
  const item = await AddressModel.findOneAndDelete({
    _id: req.params.id,
    userId: req.authUser!.id,
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Address was not found.");
  if (item.isDefault) {
    const next = await AddressModel.findOne({ userId: req.authUser!.id }).sort({
      createdAt: -1,
    });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  return success(req, res, { deleted: true, addressId: req.params.id });
});
accountRouter.post("/avatar", avatarUpload, async (req, res) => {
  if (!req.file)
    throw new AppError(422, "VALIDATION_ERROR", "Choose an image to upload.");
  const user = await User.findByIdAndUpdate(
    req.authUser!.id,
    { avatarUrl: publicUploadUrl("profiles", req.file.filename) },
    { returnDocument: "after" },
  );
  return success(req, res, { user: mapSessionUser(user) });
});
accountRouter.patch("/password", async (req, res) => {
  const parsed = passwordChangeSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Please enter valid password details.",
    );
  const user = await User.findById(req.authUser!.id);
  if (
    !user?.password ||
    !(await bcrypt.compare(parsed.data.currentPassword, user.password))
  )
    throw new AppError(
      401,
      "INVALID_PASSWORD",
      "Current password is incorrect.",
    );
  user.password = await bcrypt.hash(parsed.data.newPassword, 12);
  await user.save();
  return success(req, res, { changed: true });
});
