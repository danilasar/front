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
import {
  buildInvitationLinkViews,
  changeMemberKind,
  createEmptyExistingMember,
  createEmptyNewMember,
  normalizeCaptain,
  toTeamApplicationRequest,
  validateTeamApplicationForm,
} from "../frontend/src/domain/teamForms.ts";
import {
  formatTeamDate,
  getTeamCaptain,
  normalizeModerationReason,
  teamStatusLabels,
} from "../frontend/src/domain/teamModeration.ts";
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

test("форма команды требует одного капитана и соблюдает лимиты", () => {
  const invalid = validateTeamApplicationForm({
    name: "A",
    members: [
      { ...createEmptyExistingMember("one"), login: "alice" },
      { ...createEmptyExistingMember("two"), login: "bob" },
    ],
  }, 3, 5);

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.includes("Минимум участников: 3"), true);
  assert.equal(invalid.errors.includes("В команде должен быть ровно один капитан"), true);
});

test("выбор капитана нормализует флаги участников", () => {
  const members = normalizeCaptain([
    { ...createEmptyExistingMember("one"), login: "alice", captain: true },
    { ...createEmptyNewMember("two"), fullName: "Bob", captain: false },
  ], "two");

  assert.equal(members[0].captain, false);
  assert.equal(members[1].captain, true);
});

test("смена типа участника очищает поля другого сценария и сохраняет капитана", () => {
  const changed = changeMemberKind({
    ...createEmptyNewMember("one"),
    fullName: "Bob",
    email: "bob@example.test",
    education: "Университет",
    course: "2",
    captain: true,
  }, "existing_user");

  assert.equal(changed.kind, "existing_user");
  assert.equal(changed.fullName, "");
  assert.equal(changed.email, "");
  assert.equal(changed.captain, true);
});

test("форма команды преобразует существующих и новых участников в OpenAPI payload", () => {
  const payload = toTeamApplicationRequest({
    name: "  Aero Team  ",
    members: [
      {
        ...createEmptyExistingMember("one"),
        login: " alice ",
        captain: true,
      },
      {
        ...createEmptyNewMember("two"),
        fullName: "  Bob Newbie  ",
        email: " bob@example.test ",
        education: "  Университет  ",
        course: "  2  ",
      },
    ],
  });

  assert.equal(payload.name, "Aero Team");
  assert.deepEqual(payload.members[0], {
    kind: "existing_user",
    login: "alice",
    captain: true,
  });
  assert.deepEqual(payload.members[1], {
    kind: "new_user",
    fullName: "Bob Newbie",
    email: "bob@example.test",
    captain: false,
    profileFields: {
      education: "Университет",
      course: "2",
    },
  });
});

test("ссылки приглашений получают подписи из созданной команды", () => {
  const views = buildInvitationLinkViews({
    invitationLinks: [{ memberId: "member-1", url: "http://localhost/invite/token" }],
    team: {
      id: "team-1",
      hackathonId: "hackathon-1",
      name: "Aero Team",
      status: "submitted",
      members: [
        {
          id: "member-1",
          user: null,
          source: "invited_new_user",
          login: null,
          fullName: "Bob Newbie",
          email: "bob@example.test",
          captain: false,
          status: "pending_invitation",
          profileFields: {},
        },
      ],
      submittedAt: "2026-06-01T00:00:00.000Z",
      moderationReason: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
  });

  assert.deepEqual(views, [{
    memberId: "member-1",
    label: "Bob Newbie",
    url: "http://localhost/invite/token",
  }]);
});

test("moderation helpers находят капитана и нормализуют reason", () => {
  const captain = getTeamCaptain({
    members: [
      {
        id: "member-1",
        user: null,
        source: "existing_user",
        login: "alice",
        fullName: "Alice",
        email: null,
        captain: false,
        status: "active",
        profileFields: {},
      },
      {
        id: "member-2",
        user: null,
        source: "invited_new_user",
        login: null,
        fullName: "Bob",
        email: "bob@example.test",
        captain: true,
        status: "pending_invitation",
        profileFields: {},
      },
    ],
  });

  assert.equal(captain?.id, "member-2");
  assert.equal(normalizeModerationReason("  сильная заявка  "), "сильная заявка");
  assert.equal(normalizeModerationReason("   "), undefined);
  assert.equal(teamStatusLabels.admitted, "Допущена");
});

test("дата подачи команды форматируется для таблицы заявок", () => {
  assert.equal(formatTeamDate(null), "Не подана");
  assert.match(formatTeamDate("2026-06-01T12:30:00.000Z"), /\d{2}\.\d{2}\.\d{4}/);
});
