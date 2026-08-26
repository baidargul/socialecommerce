/* eslint-disable @typescript-eslint/no-explicit-any -- model registry cleanup is intentionally generic. */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

let mongo: MongoMemoryServer;
let app: Awaited<ReturnType<(typeof import("./app"))["createApp"]>>;
let models: typeof import("./models");

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  Object.assign(process.env, {
    MONGODB_URI: mongo.getUri("socialecommerce-test"),
    JWT_SECRET: "test-secret-that-is-at-least-thirty-two-characters",
    FRONTEND_URL: "http://localhost:3000",
    PUBLIC_API_URL: "http://localhost:5000",
    NODE_ENV: "test",
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
