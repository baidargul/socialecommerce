/* eslint-disable @typescript-eslint/no-explicit-any -- model registry cleanup is intentionally generic. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

let mongo: MongoMemoryServer;
let app: Awaited<ReturnType<(typeof import("./app"))["createApp"]>>;
let models: typeof import("./models");
let testUploadDir: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  testUploadDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "socialecommerce-test-"),
  );
  Object.assign(process.env, {
    MONGODB_URI: mongo.getUri("socialecommerce-test"),
    JWT_SECRET: "test-secret-that-is-at-least-thirty-two-characters",
    FRONTEND_URL: "http://localhost:3000",
    PUBLIC_API_URL: "http://localhost:5000",
    NODE_ENV: "test",
    UPLOAD_DIR: testUploadDir,
  });
  const database = await import("./database/connection");
  models = await import("./models");
  await database.connectDatabase();
  await models.initializeIndexes();
  app = (await import("./app")).createApp();
});
beforeEach(async () => {
  await Promise.all(
    Object.values(models)
      .filter((value: any) => value?.deleteMany)
      .map((value: any) => value.deleteMany({})),
  );
});
afterAll(async () => {
  await (await import("./database/connection")).disconnectDatabase();
  if (mongo) await mongo.stop();
  if (testUploadDir.startsWith(os.tmpdir()))
    fs.rmSync(testUploadDir, { recursive: true, force: true });
});

describe("backend API", () => {
  it("reports health", async () => {
    const response = await request(app).get("/health").expect(200);
    expect(response.body.data.status).toBe("ok");
  });
  it("creates the first user as admin and rejects duplicates", async () => {
    const payload = {
      name: "Admin User",
      username: "admin_user",
      email: "admin@example.com",
      password: "password123",
    };
    const created = await request(app)
      .post("/api/v1/auth/signup")
      .send(payload)
      .expect(200);
    expect(created.body.data.user.role).toBe("ADMIN");
    const profile = await request(app)
      .get("/api/v1/profiles/admin_user")
      .expect(200);
    expect(profile.body.data.stats).toEqual({
      posts: 0,
      products: 0,
      followers: 0,
      following: 0,
    });
    await request(app).post("/api/v1/auth/signup").send(payload).expect(409);
  });
  it("persists comments and toggles a unique like", async () => {
    const agent = request.agent(app);
    const signup = await agent
      .post("/api/v1/auth/signup")
      .send({
        name: "Admin User",
        username: "admin_user",
        email: "admin@example.com",
        password: "password123",
      })
      .expect(200);
    const post = await models.Post.create({
      creatorId: signup.body.data.user.id,
      caption: "Test",
      slug: "test",
      media: [],
    });
    await agent
      .post(`/api/v1/posts/${post.id}/comments`)
      .send({ text: "Persistent comment" })
      .expect(201);
    const comments = await agent
      .get(`/api/v1/posts/${post.id}/comments`)
      .expect(200);
    expect(comments.body.data.items).toHaveLength(1);
    const liked = await agent.post(`/api/v1/posts/${post.id}/like`).expect(200);
    expect(liked.body.data.liked).toBe(true);
    const unliked = await agent
      .post(`/api/v1/posts/${post.id}/like`)
      .expect(200);
    expect(unliked.body.data.liked).toBe(false);
    expect(await models.Like.countDocuments()).toBe(0);
  });
  it("creates posts with optional media and protects linked products", async () => {
    await request(app)
      .post("/api/v1/posts")
      .field("caption", "Not signed in")
      .expect(401);

    const owner = request.agent(app);
    const signup = await owner
      .post("/api/v1/auth/signup")
      .send({
        name: "Post Owner",
        username: "post_owner",
        email: "post-owner@example.com",
        password: "password123",
      })
      .expect(200);
    await owner.post("/api/v1/posts").field("caption", "").expect(422);

    const captionOnly = await owner
      .post("/api/v1/posts")
      .field("caption", "A caption-only post")
      .field("hashtags", JSON.stringify(["Launch", "#Social"]))
      .expect(201);
    expect(captionOnly.body.data.caption).toBe("A caption-only post");
    expect(captionOnly.body.data.hashtags).toEqual(["launch", "social"]);

    const withMedia = await owner
      .post("/api/v1/posts")
      .field("caption", "A post with media")
      .attach("media", Buffer.from("image-data"), {
        filename: "post.png",
        contentType: "application/octet-stream",
      })
      .expect(201);
    expect(withMedia.body.data.media).toHaveLength(1);
    expect(withMedia.body.data.media[0].type).toBe("image");

    const otherUser = await models.User.create({
      name: "Other Vendor",
      username: "other_vendor",
      email: "other-vendor@example.com",
      role: "VENDOR",
    });
    const foreignProduct = await models.Product.create({
      vendorId: otherUser.id,
      name: "Foreign Product",
      slug: "foreign-product",
      price: 20,
      stockQuantity: 1,
    });
    await owner
      .post("/api/v1/posts")
      .field("caption", "Invalid product link")
      .field("productId", foreignProduct.id)
      .expect(403);

    const profile = await request(app)
      .get(`/api/v1/profiles/${signup.body.data.user.username}`)
      .expect(200);
    expect(profile.body.data.stats.posts).toBe(2);
    expect(profile.body.data.posts).toHaveLength(2);

    const uploadedFile = path.join(
      testUploadDir,
      "posts",
      path.basename(new URL(withMedia.body.data.media[0].url).pathname),
    );
    expect(fs.existsSync(uploadedFile)).toBe(true);
    await models.Comment.create({
      postId: withMedia.body.data.id,
      userId: signup.body.data.user.id,
      text: "Delete this comment with the post",
    });
    await models.Like.create({
      postId: withMedia.body.data.id,
      userId: signup.body.data.user.id,
    });
    await request(app)
      .delete(`/api/v1/posts/${withMedia.body.data.id}`)
      .expect(401);
    const intruder = request.agent(app);
    await intruder
      .post("/api/v1/auth/signup")
      .send({
        name: "Post Intruder",
        username: "post_intruder",
        email: "post-intruder@example.com",
        password: "password123",
      })
      .expect(200);
    await intruder
      .delete(`/api/v1/posts/${withMedia.body.data.id}`)
      .expect(403);
    await owner.delete(`/api/v1/posts/${withMedia.body.data.id}`).expect(200);
    expect(await models.Post.findById(withMedia.body.data.id)).toBeNull();
    expect(
      await models.Comment.countDocuments({ postId: withMedia.body.data.id }),
    ).toBe(0);
    expect(
      await models.Like.countDocuments({ postId: withMedia.body.data.id }),
    ).toBe(0);
    expect(fs.existsSync(uploadedFile)).toBe(false);

    const profileAfterDelete = await request(app)
      .get(`/api/v1/profiles/${signup.body.data.user.username}`)
      .expect(200);
    expect(profileAfterDelete.body.data.stats.posts).toBe(1);
    expect(profileAfterDelete.body.data.posts).toHaveLength(1);
  });
  it("lets an authenticated customer create a product with Android-style media", async () => {
    await request(app).post("/api/v1/auth/signup").send({
      name: "Initial Admin",
      username: "initial_admin",
      email: "initial-admin@example.com",
      password: "password123",
    });
    const customer = request.agent(app);
    const signup = await customer
      .post("/api/v1/auth/signup")
      .send({
        name: "Mobile Seller",
        username: "mobile_seller",
        email: "mobile-seller@example.com",
        password: "password123",
      })
      .expect(200);
    expect(signup.body.data.user.role).toBe("CUSTOMER");

    const created = await customer
      .post("/api/v1/products")
      .field("name", "Mobile photo product")
      .field("price", "19.99")
      .field("stockQuantity", "2")
      .field("images", "[]")
      .field("tags", "[]")
      .attach("media", Buffer.from("android-image-data"), {
        filename: "camera-photo.jpg",
        contentType: "application/octet-stream",
      })
      .expect(201);

    expect(created.body.data.vendorId).toBe(signup.body.data.user.id);
    expect(created.body.data.media).toHaveLength(1);
    expect(created.body.data.media[0].type).toBe("image");
    expect(created.body.data.createdAt).toBeTruthy();

    const uploadedFile = path.join(
      testUploadDir,
      "products",
      path.basename(new URL(created.body.data.images[0]).pathname),
    );
    expect(fs.existsSync(uploadedFile)).toBe(true);
    await models.CartItem.create({
      userId: signup.body.data.user.id,
      productId: created.body.data.id,
      quantity: 1,
    });
    await request(app)
      .delete(`/api/v1/products/${created.body.data.id}`)
      .expect(401);
    const intruder = request.agent(app);
    await intruder
      .post("/api/v1/auth/signup")
      .send({
        name: "Product Intruder",
        username: "product_intruder",
        email: "product-intruder@example.com",
        password: "password123",
      })
      .expect(200);
    await intruder
      .delete(`/api/v1/products/${created.body.data.id}`)
      .expect(403);
    await customer
      .delete(`/api/v1/products/${created.body.data.id}`)
      .expect(200);
    expect(await models.Product.findById(created.body.data.id)).toBeNull();
    expect(
      await models.CartItem.countDocuments({ productId: created.body.data.id }),
    ).toBe(0);
    expect(fs.existsSync(uploadedFile)).toBe(false);
  });
  it("searches published posts, products, and users without exposing email", async () => {
    const user = await models.User.create({
      name: "Clay Artist",
      username: "clay_artist",
      email: "clay@example.com",
      role: "CREATOR",
      bio: "Handmade ceramic pieces",
    });
    const product = await models.Product.create({
      vendorId: user.id,
      name: "Ceramic Bowl",
      slug: "ceramic-bowl",
      tags: ["clay"],
      price: 25,
      stockQuantity: 2,
      status: "ACTIVE",
    });
    await models.Post.create([
      {
        creatorId: user.id,
        caption: "Fresh clay collection",
        slug: "fresh-clay",
        productId: product.id,
        status: "PUBLISHED",
      },
      {
        creatorId: user.id,
        caption: "Private clay draft",
        slug: "private-clay",
        status: "DRAFT",
      },
    ]);

    const response = await request(app)
      .get("/api/v1/search")
      .query({ q: "clay" })
      .expect(200);
    expect(response.body.data.products).toHaveLength(1);
    expect(response.body.data.posts).toHaveLength(1);
    expect(response.body.data.posts[0].slug).toBe("fresh-clay");
    expect(response.body.data.users).toHaveLength(1);
    expect(response.body.data.users[0].email).toBeUndefined();

    const empty = await request(app)
      .get("/api/v1/search")
      .query({ q: "" })
      .expect(200);
    expect(empty.body.data).toEqual({ products: [], posts: [], users: [] });
  });
  it("checks out without MongoDB transactions and prevents overselling", async () => {
    const agent = request.agent(app);
    const signup = await agent.post("/api/v1/auth/signup").send({
      name: "Admin User",
      username: "admin_user",
      email: "admin@example.com",
      password: "password123",
    });
    const userId = signup.body.data.user.id;
    const product = await models.Product.create({
      vendorId: userId,
      name: "One item",
      slug: "one-item",
      price: 25,
      stockQuantity: 1,
      status: "ACTIVE",
    });
    await agent
      .post("/api/v1/cart/add")
      .send({ productId: product.id, quantity: 1 })
      .expect(200);
    const order = await agent
      .post("/api/v1/orders")
      .set("Idempotency-Key", "checkout-1")
      .send({
        paymentMethod: "COD",
        shippingAddress: {
          fullName: "Admin User",
          phone: "1234567",
          addressLine: "Street address",
          city: "City",
          country: "Country",
        },
      })
      .expect(201);
    expect(order.body.data.total).toBe(25);
    expect((await models.Product.findById(product.id))?.stockQuantity).toBe(0);
  });
});
