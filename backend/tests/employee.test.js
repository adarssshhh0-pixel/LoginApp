const request = require("supertest");
const { app } = require("../server");

let token = "";

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "pranay@isoftzone.com", password: "123456" });
  token = res.body.token;
});

describe("Employee API Tests", () => {
  test("GET /api/employees — should return employee list", async () => {
    const res = await request(app)
      .get("/api/employees")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/employees — should support pagination", async () => {
    const res = await request(app)
      .get("/api/employees?page=1&limit=5")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("totalPages");
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  test("GET /api/employees — should support search", async () => {
    const res = await request(app)
      .get("/api/employees?search=Pranay")
      .set("Authorization", token);
    expect(res.statusCode).toBe(200);
  });
});