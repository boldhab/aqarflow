import request from "supertest";
import { app } from "../src/app";

describe("App Integration Smoke Test", () => {
  it("rejects browser writes from untrusted origins", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Origin", "https://untrusted.example");
    expect(response.status).toBe(403);
  });
  it("does not grant credentialed CORS access to lookalike localhost domains", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "https://localhost.attacker.example");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
  it("GET /health should return 200 and status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
