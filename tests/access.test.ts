import test from "node:test";
import assert from "node:assert/strict";
import {
  canCreateHackathon,
  explainHackathonManagementAccess,
  isAssignedOrganizer,
  uniqueIds,
} from "../frontend/src/domain/access.ts";
import {
  toHackathonRequest,
  toOrganizerRequest,
  validateHackathonForm,
  validateOrganizerForm,
} from "../frontend/src/domain/adminForms.ts";
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

test("форма организатора валидирует обязательные поля", () => {
  const invalid = validateOrganizerForm({
    fullName: "",
    email: "broken",
    password: "short",
    phone: "",
  });

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 3);
});

test("форма организатора готовит payload без лишних пробелов", () => {
  assert.deepEqual(toOrganizerRequest({
    fullName: "  Анна Организатор  ",
    email: "  anna@example.test  ",
    password: "password",
    phone: "",
  }), {
    fullName: "Анна Организатор",
    email: "anna@example.test",
    password: "password",
    phone: null,
  });
});

test("форма хакатона запрещает некорректный диапазон дат и размера команды", () => {
  const invalid = validateHackathonForm({
    title: "A",
    description: "",
    startsAt: "2026-06-02",
    endsAt: "2026-06-01",
    minTeamSize: 4,
    maxTeamSize: 2,
    organizerId: "",
  });

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 3);
});

test("форма хакатона преобразуется в OpenAPI payload", () => {
  const payload = toHackathonRequest({
    title: "  Летний хакатон  ",
    description: "  Командное событие  ",
    startsAt: "2026-06-01",
    endsAt: "2026-06-03",
    minTeamSize: 2,
    maxTeamSize: 5,
    organizerId: "organizer-1",
  });

  assert.equal(payload.title, "Летний хакатон");
  assert.equal(payload.description, "Командное событие");
  assert.equal(payload.minTeamSize, 2);
  assert.equal(payload.maxTeamSize, 5);
  assert.equal(payload.landing?.heroTitle, "Летний хакатон");
  assert.match(payload.startsAt, /^2026-06-01T/);
  assert.match(payload.endsAt, /^2026-06-03T/);
});
