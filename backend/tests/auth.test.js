const request = require("supertest");
const { app } = require("../server");

console.log("APP TYPE:", typeof app);
console.log("APP:", app);

describe("Auth API Tests", () => {
  test("POST /api/auth/login — should fail with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "pranay@isoftzone.com", password: "wrongpassword" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Wrong Password");
  });

  test("POST /api/auth/login — should fail with unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unknown@test.com", password: "123456" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("User not found");
  });

  test("POST /api/auth/signup — should fail with duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Test", email: "pranay@isoftzone.com", password: "123456" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email already exists");
  });
});