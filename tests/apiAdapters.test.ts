import test from "node:test";
import assert from "node:assert/strict";
import api from "../frontend/src/api/axios.ts";
import {
  adminApi,
  authApi,
  hackathonApi,
  invitationApi,
  teamApi,
} from "../frontend/src/api/hackathonApi.ts";

type ApiCall = {
  method: string;
  url: string;
  data?: unknown;
  config?: unknown;
};

const withMockedApi = async (
  responses: unknown[],
  run: (calls: ApiCall[]) => Promise<void>,
) => {
  const client = api as unknown as Record<string, unknown>;
  const original = {
    get: client.get,
    post: client.post,
    put: client.put,
    patch: client.patch,
    delete: client.delete,
  };
  const calls: ApiCall[] = [];
  const queue = [...responses];
  const next = () => ({ data: queue.shift() });

  client.get = async (url: string, config?: unknown) => {
    calls.push({ method: "get", url, config });
    return next();
  };
  client.post = async (url: string, data?: unknown, config?: unknown) => {
    calls.push({ method: "post", url, data, config });
    return next();
  };
  client.put = async (url: string, data?: unknown, config?: unknown) => {
    calls.push({ method: "put", url, data, config });
    return next();
  };
  client.patch = async (url: string, data?: unknown, config?: unknown) => {
    calls.push({ method: "patch", url, data, config });
    return next();
  };
  client.delete = async (url: string, config?: unknown) => {
    calls.push({ method: "delete", url, config });
    return next();
  };

  try {
    await run(calls);
  } finally {
    client.get = original.get;
    client.post = original.post;
    client.put = original.put;
    client.patch = original.patch;
    client.delete = original.delete;
  }
};

test("authApi использует контрактные auth endpoints", async () => {
  await withMockedApi([
    { user: { id: "user-1" }, tokens: { accessToken: "a", refreshToken: "r" } },
    { accessToken: "a2", refreshToken: "r2" },
    { id: "user-1" },
  ], async (calls) => {
    assert.equal((await authApi.login({ email: "u@example.test", password: "password" })).tokens.accessToken, "a");
    assert.deepEqual(calls[0], {
      method: "post",
      url: "/auth/login",
      data: { email: "u@example.test", password: "password" },
      config: undefined,
    });

    assert.equal((await authApi.refresh("refresh")).accessToken, "a2");
    assert.deepEqual(calls[1], {
      method: "post",
      url: "/auth/refresh",
      data: { refreshToken: "refresh" },
      config: undefined,
    });

    assert.equal((await authApi.me()).id, "user-1");
    assert.deepEqual(calls[2], { method: "get", url: "/users/me", config: undefined });
  });
});

test("adminApi и hackathonApi отправляют URL, params и multipart как в OpenAPI", async () => {
  const hackathonPayload = { title: "Hack", description: "Desc" };
  await withMockedApi([
    { items: [] },
    { id: "organizer-1" },
    undefined,
    { items: [] },
    { id: "hackathon-1" },
    { id: "hackathon-1" },
    { id: "hackathon-1" },
    { id: "hackathon-1" },
    [],
    { id: "field-1" },
    { id: "field-1" },
    undefined,
  ], async (calls) => {
    await adminApi.listOrganizers();
    await adminApi.createOrganizer({ email: "org@example.test", fullName: "Organizer", password: "password" });
    await adminApi.assignOrganizer("hackathon-1", "organizer-1");
    await hackathonApi.list("active");
    await hackathonApi.get("hackathon-1");
    await hackathonApi.create(hackathonPayload);
    await hackathonApi.update("hackathon-1", { title: "Updated" });
    await hackathonApi.activate("hackathon-1");
    await hackathonApi.fields("hackathon-1", "team");
    await hackathonApi.createField("hackathon-1", { scope: "team", key: "track", label: "Track", description: null, type: "text", required: true, visible: true, order: 1, options: [], validation: {} });
    await hackathonApi.updateField("hackathon-1", "field-1", { label: "Updated" });
    await hackathonApi.deleteField("hackathon-1", "field-1");

    assert.deepEqual(calls.map((call) => [call.method, call.url]), [
      ["get", "/admin/organizers"],
      ["post", "/admin/organizers"],
      ["put", "/admin/hackathons/hackathon-1/organizers/organizer-1"],
      ["get", "/hackathons"],
      ["get", "/hackathons/hackathon-1"],
      ["post", "/hackathons"],
      ["patch", "/hackathons/hackathon-1"],
      ["post", "/hackathons/hackathon-1/activate"],
      ["get", "/hackathons/hackathon-1/form-fields"],
      ["post", "/hackathons/hackathon-1/form-fields"],
      ["patch", "/hackathons/hackathon-1/form-fields/field-1"],
      ["delete", "/hackathons/hackathon-1/form-fields/field-1"],
    ]);
    assert.deepEqual(calls[3].config, { params: { status: "active" } });
    assert.deepEqual(calls[8].config, { params: { scope: "team" } });
    assert.deepEqual(calls[5].data, hackathonPayload);
  });

  await withMockedApi([{ id: "hackathon-1" }], async (calls) => {
    const file = new File(["rules"], "rules.pdf", { type: "application/pdf" });
    await hackathonApi.uploadRules("hackathon-1", file);

    assert.equal(calls[0].method, "put");
    assert.equal(calls[0].url, "/hackathons/hackathon-1/rules");
    assert.equal((calls[0].config as { headers: Record<string, string> }).headers["Content-Type"], "multipart/form-data");
    assert.equal(calls[0].data instanceof FormData, true);
  });
});

test("teamApi и invitationApi используют backend для модерации, экспорта и invite onboarding", async () => {
  const application = { name: "Aero", members: [{ kind: "existing_user" as const, login: "alice", captain: true }] };
  const exportBlob = new Blob(["csv"], { type: "text/csv" });

  await withMockedApi([
    { items: [] },
    { team: { id: "team-1" }, invitationLinks: [] },
    { id: "team-1" },
    { id: "team-1" },
    exportBlob,
    { token: "invite-token" },
    { id: "team-1" },
    { user: { id: "user-1" }, tokens: { accessToken: "a", refreshToken: "r" } },
  ], async (calls) => {
    await teamApi.list("hackathon-1", "submitted");
    await teamApi.createApplication("hackathon-1", application);
    await teamApi.setStatus("hackathon-1", "team-1", "admitted", "ok");
    await teamApi.disqualifyMember("hackathon-1", "team-1", "member-1");
    assert.equal(await teamApi.exportTeams("hackathon-1", "csv"), exportBlob);
    await invitationApi.get("invite-token");
    await invitationApi.acceptExisting("invite-token");
    await invitationApi.completeRegistration("invite-token", { fullName: "New User", email: "new@example.test", password: "password", profileFields: {} });

    assert.deepEqual(calls.map((call) => [call.method, call.url]), [
      ["get", "/hackathons/hackathon-1/teams"],
      ["post", "/hackathons/hackathon-1/teams"],
      ["patch", "/hackathons/hackathon-1/teams/team-1/status"],
      ["post", "/hackathons/hackathon-1/teams/team-1/members/member-1/disqualify"],
      ["get", "/hackathons/hackathon-1/exports/teams"],
      ["get", "/invitations/invite-token"],
      ["post", "/invitations/invite-token/accept-existing"],
      ["post", "/invitations/invite-token/complete-registration"],
    ]);
    assert.deepEqual(calls[0].config, { params: { status: "submitted" } });
    assert.deepEqual(calls[2].data, { status: "admitted", reason: "ok" });
    assert.deepEqual(calls[4].config, { params: { format: "csv" }, responseType: "blob" });
  });
});
