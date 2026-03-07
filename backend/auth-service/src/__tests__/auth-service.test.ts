import assert from "node:assert/strict";
import test from "node:test";

import { currentUserController } from "../controllers/auth-controller";
import { mockPassword, mockUser, mockUsername } from "../config";
import { getBearerToken } from "../lib/http-utils";
import { createAccessToken, isValidCredentials, verifyAccessToken } from "../services/auth-service";

function createMockResponse(): {
  res: HttpResponse;
  getStatusCode: () => number;
  getJsonBody: () => unknown;
} {
  let statusCode = 0;
  let body = "";

  const res = {
    writeHead(code: number) {
      statusCode = code;
      return this;
    },
    end(chunk?: string) {
      body = chunk || "";
      return this;
    },
  } as unknown as HttpResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getJsonBody: () => JSON.parse(body || "{}"),
  };
}

test("isValidCredentials validates configured mock credentials", () => {
  assert.equal(isValidCredentials(mockUsername, mockPassword), true);
  assert.equal(isValidCredentials("wrong@example.com", mockPassword), false);
  assert.equal(isValidCredentials(mockUsername, "wrong-password"), false);
});

test("createAccessToken + verifyAccessToken returns expected payload", () => {
  const token = createAccessToken(mockUser);
  const payload = verifyAccessToken(token);

  assert.ok(payload);
  assert.equal(payload?.sub, mockUser.id);
  assert.equal(payload?.email, mockUser.email);
  assert.equal(payload?.name, mockUser.name);
});

test("verifyAccessToken returns null for invalid token", () => {
  assert.equal(verifyAccessToken("not-a-real-token"), null);
});

test("getBearerToken reads valid bearer token and rejects malformed values", () => {
  const validReq = { headers: { authorization: "Bearer test-token" } } as HttpRequest;
  const invalidReq = { headers: { authorization: "Basic test-token" } } as HttpRequest;
  const emptyReq = { headers: {} } as HttpRequest;

  assert.equal(getBearerToken(validReq), "test-token");
  assert.equal(getBearerToken(invalidReq), null);
  assert.equal(getBearerToken(emptyReq), null);
});

test("currentUserController returns 401 when Bearer token is missing", () => {
  const req = { headers: {} } as HttpRequest;
  const { res, getStatusCode, getJsonBody } = createMockResponse();

  currentUserController(req, res);

  assert.equal(getStatusCode(), 401);
  assert.deepEqual(getJsonBody(), { error: "Missing Bearer token" });
});

test("currentUserController returns current user for valid token", () => {
  const token = createAccessToken(mockUser);
  const req = { headers: { authorization: `Bearer ${token}` } } as HttpRequest;
  const { res, getStatusCode, getJsonBody } = createMockResponse();

  currentUserController(req, res);

  assert.equal(getStatusCode(), 200);
  assert.deepEqual(getJsonBody(), {
    user: {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
    },
  });
});
