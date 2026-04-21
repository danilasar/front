import test from "node:test";
import assert from "node:assert/strict";
import {
  canCreateHackathon,
  explainHackathonManagementAccess,
  isAssignedOrganizer,
  uniqueIds,
} from "../frontend/src/domain/access.ts";
import type { Hackathon, UserProfile } from "../frontend/src/domain/types.ts";

const hackathon = (organizerIds: string[]): Pick<Hackathon, "organizerIds"> => ({
  organizerIds,
});

const user = (id: string, role: UserProfile["role"]): Pick<UserProfile, "id" | "role"> => ({
  id,
  role,
});

test("только администратор создает хакатоны", () => {
  assert.equal(canCreateHackathon("admin"), true);
  assert.equal(canCreateHackathon("organizer"), false);
  assert.equal(canCreateHackathon("participant"), false);
  assert.equal(canCreateHackathon(undefined), false);
});

test("организатор управляет только назначенным хакатоном", () => {
  const organizer = user("organizer-1", "organizer");

  assert.equal(isAssignedOrganizer(organizer, hackathon(["organizer-1"])), true);
  assert.equal(isAssignedOrganizer(organizer, hackathon(["organizer-2"])), false);
});

test("администратор тоже должен быть назначен для внутренних действий хакатона", () => {
  const admin = user("admin-1", "admin");

  assert.equal(explainHackathonManagementAccess(admin, hackathon(["organizer-1"])).allowed, false);
  assert.equal(explainHackathonManagementAccess(admin, hackathon(["admin-1"])).allowed, true);
});

test("участник не получает управленческий доступ даже при наличии id в назначениях", () => {
  const participant = user("participant-1", "participant");

  assert.equal(isAssignedOrganizer(participant, hackathon(["participant-1"])), false);
  assert.equal(explainHackathonManagementAccess(participant, hackathon(["participant-1"])).allowed, false);
});

test("назначения организаторов нормализуются до уникального списка", () => {
  assert.deepEqual(uniqueIds(["a", "a", "b", "a"]), ["a", "b"]);
});
