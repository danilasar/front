import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";

const port = Number(process.env.MOCK_BACKEND_PORT ?? process.env.PORT ?? 8000);
const basePath = "/api/v1";
const now = () => new Date().toISOString();

const ids = {
  admin: "00000000-0000-4000-8000-000000000001",
  organizer: "00000000-0000-4000-8000-000000000002",
  participant: "00000000-0000-4000-8000-000000000003",
  hackathon: "10000000-0000-4000-8000-000000000001",
  team: "20000000-0000-4000-8000-000000000001",
  member: "30000000-0000-4000-8000-000000000001",
  field: "40000000-0000-4000-8000-000000000001",
  feedback: "50000000-0000-4000-8000-000000000001",
  file: "60000000-0000-4000-8000-000000000001",
};

const users = [
  user({
    id: ids.admin,
    email: "admin@example.test",
    login: "admin",
    fullName: "Администратор Платформы",
    role: "admin",
  }),
  user({
    id: ids.organizer,
    email: "organizer@example.test",
    login: "organizer",
    fullName: "Организатор Хакатона",
    role: "organizer",
  }),
  user({
    id: ids.participant,
    email: "participant@example.test",
    login: "participant",
    fullName: "Участник Команды",
    role: "participant",
  }),
];

const hackathons = [
  {
    id: ids.hackathon,
    title: "Весенний хакатон",
    description: "Тестовый хакатон из mock backend.",
    status: "active",
    startsAt: "2026-05-10T08:00:00.000Z",
    endsAt: "2026-05-12T18:00:00.000Z",
    registrationOpensAt: "2026-04-01T08:00:00.000Z",
    registrationClosesAt: "2026-05-01T18:00:00.000Z",
    minTeamSize: 1,
    maxTeamSize: 5,
    rulesFile: null,
    organizerIds: [ids.admin, ids.organizer],
    landing: {
      heroTitle: "Весенний хакатон",
      heroSubtitle: "Соберите команду и подайте заявку.",
      coverFileId: null,
      content: "Тестовое описание лендинга.",
    },
    createdAt: now(),
    updatedAt: now(),
  },
];

const formFields = [
  {
    id: ids.field,
    hackathonId: ids.hackathon,
    scope: "team",
    key: "education",
    label: "Учебное заведение",
    description: null,
    type: "text",
    required: true,
    visible: true,
    order: 1,
    options: [],
    validation: { minLength: 2, maxLength: 200 },
  },
];

const invitations = [
  {
    token: "invite-demo",
    hackathonId: ids.hackathon,
    teamId: ids.team,
    memberId: ids.member,
    fullName: "Новый Участник",
    email: "newbie@example.test",
    status: "pending",
    prefilledProfileFields: { education: "Тестовый университет", course: "2" },
    expiresAt: "2026-12-31T23:59:59.000Z",
  },
];

const teams = [
  {
    id: ids.team,
    hackathonId: ids.hackathon,
    name: "Команда Демо",
    status: "submitted",
    members: [
      {
        id: ids.member,
        user: publicUser(users[2]),
        source: "existing_user",
        login: "participant",
        fullName: "Участник Команды",
        email: "participant@example.test",
        captain: true,
        status: "active",
        invitation: null,
        profileFields: { education: "Тестовый университет", course: "3" },
      },
    ],
    submittedAt: now(),
    moderationReason: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

const feedback = [
  {
    id: ids.feedback,
    hackathonId: ids.hackathon,
    userId: ids.participant,
    fields: { rating: "5", comment: "Все работает." },
    createdAt: now(),
  },
];

const files = [
  {
    id: ids.file,
    url: "http://127.0.0.1:8000/mock-file.pdf",
    originalName: "rules.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    createdAt: now(),
  },
];

function user(input) {
  return {
    id: input.id ?? randomUUID(),
    email: input.email,
    login: input.login ?? makeLogin(input.fullName),
    fullName: input.fullName,
    role: input.role,
    avatar: null,
    education: input.education ?? null,
    course: input.course ?? null,
    phone: input.phone ?? null,
    telegram: input.telegram ?? null,
    vk: input.vk ?? null,
    foodAllergies: input.foodAllergies ?? null,
    tshirtSize: input.tshirtSize ?? null,
    profileFields: input.profileFields ?? {},
    blocked: input.blocked ?? false,
    password: input.password ?? "password",
    createdAt: now(),
    updatedAt: now(),
  };
}

function publicUser(value) {
  return {
    id: value.id,
    login: value.login,
    fullName: value.fullName,
    role: value.role,
    avatar: value.avatar,
  };
}

function makeLogin(name) {
  return String(name ?? "user")
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, ".")
    .replace(/^\.+|\.+$/g, "") || `user.${randomUUID().slice(0, 8)}`;
}

function page(items, url) {
  const pageNum = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize") ?? 20)));
  const start = (pageNum - 1) * pageSize;
  return {
    page: pageNum,
    pageSize,
    total: items.length,
    items: items.slice(start, start + pageSize),
  };
}

function parseToken(req) {
  const header = req.headers.authorization ?? "";
  const [, token] = header.split(" ");
  if (!token) return null;
  const id = token.replace(/^mock-access-/, "");
  return users.find((item) => item.id === id) ?? null;
}

function tokensFor(value) {
  return {
    accessToken: `mock-access-${value.id}`,
    refreshToken: `mock-refresh-${value.id}`,
  };
}

function requireUser(req, res) {
  const current = parseToken(req);
  if (!current) {
    send(res, 401, { code: "unauthorized", message: "Не авторизован" });
    return null;
  }
  return current;
}

function requireAdmin(req, res) {
  const current = requireUser(req, res);
  if (!current) return null;
  if (current.role !== "admin") {
    send(res, 403, { code: "forbidden", message: "Недостаточно прав администратора" });
    return null;
  }
  return current;
}

function requireAssignedOrganizer(req, res, hackathonId) {
  const current = requireUser(req, res);
  if (!current) return null;
  const hackathon = hackathons.find((item) => item.id === hackathonId);
  if (!hackathon) {
    send(res, 404, { code: "not_found", message: "Хакатон не найден" });
    return null;
  }
  if (!hackathon.organizerIds.includes(current.id)) {
    send(res, 403, { code: "forbidden", message: "Пользователь не назначен организатором хакатона" });
    return null;
  }
  return current;
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      req.on("data", () => {});
      req.on("end", () => resolve({}));
      return;
    }
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function send(res, status, body, headers = {}) {
  const baseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept",
    ...headers,
  };
  if (status === 204) {
    res.writeHead(status, baseHeaders);
    res.end();
    return;
  }
  if (typeof body === "string" || Buffer.isBuffer(body)) {
    res.writeHead(status, baseHeaders);
    res.end(body);
    return;
  }
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...baseHeaders });
  res.end(JSON.stringify(body, null, 2));
}

function notFound(res) {
  send(res, 404, { code: "not_found", message: "Маршрут не найден" });
}

function legacyUser(value) {
  const [firstName, ...rest] = value.fullName.split(" ");
  return {
    id: 1,
    email: value.email,
    firstName: firstName || value.fullName,
    secondName: rest.join(" ") || "Пользователь",
  };
}

function legacyQuote(team = teams[0]) {
  return {
    quoteText: `${team.name}: заявка на ${hackathons[0].title}`,
    username: users[2].fullName,
    creationDate: team.createdAt,
  };
}

async function handleLegacy(req, res, url, path, body) {
  if (req.method === "POST" && path === "/Auth/Login") {
    const found = users.find((item) => item.email === body.email) ?? users[0];
    send(res, 200, { accessToken: tokensFor(found).accessToken, refreshToken: tokensFor(found).refreshToken });
    return true;
  }
  if (req.method === "POST" && path === "/Auth/Registration") {
    const created = user({
      email: body.email ?? `user-${Date.now()}@example.test`,
      fullName: `${body.firstName ?? "Новый"} ${body.secondName ?? "Пользователь"}`,
      role: "participant",
      password: body.password,
    });
    users.push(created);
    send(res, 200, { accessToken: tokensFor(created).accessToken, refreshToken: tokensFor(created).refreshToken });
    return true;
  }
  if ((req.method === "POST" || req.method === "PUT") && path === "/Auth/RefreshAllTokens") {
    const current = parseToken(req) ?? users[0];
    send(res, 200, { accessToken: tokensFor(current).accessToken, refreshToken: tokensFor(current).refreshToken });
    return true;
  }
  if (req.method === "GET" && path === "/User/myprofile") {
    const current = parseToken(req) ?? users[0];
    send(res, 200, legacyUser(current));
    return true;
  }
  if (req.method === "POST" && path === "/Quote") {
    const text = url.searchParams.get("quoteText") ?? body.quoteText ?? "Новая цитата";
    const team = {
      ...teams[0],
      id: randomUUID(),
      name: text,
      createdAt: now(),
      updatedAt: now(),
    };
    teams.push(team);
    send(res, 201, legacyQuote(team));
    return true;
  }
  const quotePageMatch = path.match(/^\/Quote\/(\d+)\/(\d+)$/);
  if (req.method === "GET" && quotePageMatch) {
    const offset = Number(quotePageMatch[1]);
    const limit = Number(quotePageMatch[2]);
    send(res, 200, teams.slice(offset, offset + limit).map(legacyQuote));
    return true;
  }
  if (req.method === "GET" && path === "/Quote/TotalQuotes") {
    send(res, 200, teams.length);
    return true;
  }
  if (req.method === "GET" && path === "/Quote/GetRand") {
    send(res, 200, legacyQuote(teams[teams.length - 1]));
    return true;
  }
  return false;
}

async function handleApi(req, res, url, path, body) {
  if (req.method === "GET" && path === "/health") {
    send(res, 200, { status: "ok", service: "mock-backend", time: now() });
    return;
  }

  if (req.method === "POST" && path === "/auth/login") {
    const found = users.find((item) => item.email === body.email) ?? users[0];
    send(res, 200, { user: found, tokens: tokensFor(found) });
    return;
  }

  if (req.method === "POST" && path === "/auth/register") {
    if (!body.email || !body.password || !body.fullName) {
      send(res, 422, { code: "validation_error", message: "Заполните email, password и fullName", fields: [] });
      return;
    }
    if (users.some((item) => item.email === body.email)) {
      send(res, 409, { code: "email_taken", message: "Email уже занят" });
      return;
    }
    const created = user({ email: body.email, fullName: body.fullName, password: body.password, role: "participant" });
    users.push(created);
    send(res, 201, { user: created, tokens: tokensFor(created) });
    return;
  }

  if (req.method === "POST" && path === "/auth/refresh") {
    const id = String(body.refreshToken ?? "").replace(/^mock-refresh-/, "");
    const found = users.find((item) => item.id === id) ?? users[0];
    send(res, 200, tokensFor(found));
    return;
  }

  if (req.method === "POST" && path === "/auth/logout") {
    send(res, 204);
    return;
  }

  if (path === "/users/me") {
    const current = requireUser(req, res);
    if (!current) return;
    if (req.method === "GET") {
      send(res, 200, current);
      return;
    }
    if (req.method === "PATCH") {
      Object.assign(current, body, { updatedAt: now() });
      send(res, 200, current);
      return;
    }
  }

  const userMatch = path.match(/^\/users\/([^/]+)$/);
  if (req.method === "GET" && userMatch) {
    const found = users.find((item) => item.id === userMatch[1]);
    found ? send(res, 200, publicUser(found)) : notFound(res);
    return;
  }

  if (path === "/admin/organizers") {
    requireAdmin(req, res);
    if (res.writableEnded) return;
    if (req.method === "GET") {
      send(res, 200, page(users.filter((item) => item.role === "organizer" || item.role === "admin"), url));
      return;
    }
    if (req.method === "POST") {
      const created = user({ ...body, role: "organizer" });
      users.push(created);
      send(res, 201, created);
      return;
    }
  }

  const organizerMatch = path.match(/^\/admin\/organizers\/([^/]+)$/);
  if (organizerMatch && req.method === "PATCH") {
    requireAdmin(req, res);
    if (res.writableEnded) return;
    const found = users.find((item) => item.id === organizerMatch[1]);
    if (!found) return notFound(res);
    Object.assign(found, body, { updatedAt: now() });
    send(res, 200, found);
    return;
  }

  const adminHackathonOrganizers = path.match(/^\/admin\/hackathons\/([^/]+)\/organizers$/);
  if (adminHackathonOrganizers) {
    requireAdmin(req, res);
    if (res.writableEnded) return;
    const hackathon = hackathons.find((item) => item.id === adminHackathonOrganizers[1]);
    if (!hackathon) return notFound(res);
    if (req.method === "GET") {
      send(res, 200, hackathon.organizerIds.map((id) => users.find((item) => item.id === id)).filter(Boolean).map(publicUser));
      return;
    }
    if (req.method === "PUT") {
      hackathon.organizerIds = [...new Set(body.organizerIds ?? [])];
      hackathon.updatedAt = now();
      send(res, 200, hackathon.organizerIds.map((id) => users.find((item) => item.id === id)).filter(Boolean).map(publicUser));
      return;
    }
  }

  const adminHackathonOrganizer = path.match(/^\/admin\/hackathons\/([^/]+)\/organizers\/([^/]+)$/);
  if (adminHackathonOrganizer) {
    requireAdmin(req, res);
    if (res.writableEnded) return;
    const hackathon = hackathons.find((item) => item.id === adminHackathonOrganizer[1]);
    if (!hackathon) return notFound(res);
    const organizerId = adminHackathonOrganizer[2];
    if (req.method === "PUT") {
      if (!hackathon.organizerIds.includes(organizerId)) hackathon.organizerIds.push(organizerId);
      hackathon.updatedAt = now();
      send(res, 204);
      return;
    }
    if (req.method === "DELETE") {
      hackathon.organizerIds = hackathon.organizerIds.filter((id) => id !== organizerId);
      hackathon.updatedAt = now();
      send(res, 204);
      return;
    }
  }

  if (path === "/hackathons") {
    if (req.method === "GET") {
      const status = url.searchParams.get("status");
      const items = status ? hackathons.filter((item) => item.status === status) : hackathons;
      send(res, 200, page(items, url));
      return;
    }
    if (req.method === "POST") {
      requireAdmin(req, res);
      if (res.writableEnded) return;
      const created = {
        id: randomUUID(),
        title: body.title ?? "Новый хакатон",
        description: body.description ?? null,
        status: "draft",
        startsAt: body.startsAt ?? now(),
        endsAt: body.endsAt ?? now(),
        registrationOpensAt: body.registrationOpensAt ?? null,
        registrationClosesAt: body.registrationClosesAt ?? null,
        minTeamSize: body.minTeamSize ?? 1,
        maxTeamSize: body.maxTeamSize ?? 5,
        rulesFile: null,
        organizerIds: body.organizerIds ?? [],
        landing: body.landing ?? {},
        createdAt: now(),
        updatedAt: now(),
      };
      hackathons.push(created);
      send(res, 201, created);
      return;
    }
  }

  if (req.method === "GET" && path === "/hackathons/active") {
    const active = hackathons.find((item) => item.status === "active");
    active ? send(res, 200, active) : notFound(res);
    return;
  }

  const hackathonMatch = path.match(/^\/hackathons\/([^/]+)$/);
  if (hackathonMatch) {
    const hackathon = hackathons.find((item) => item.id === hackathonMatch[1]);
    if (!hackathon) return notFound(res);
    if (req.method === "GET") {
      send(res, 200, hackathon);
      return;
    }
    if (req.method === "PATCH") {
      requireAssignedOrganizer(req, res, hackathon.id);
      if (res.writableEnded) return;
      Object.assign(hackathon, body, { updatedAt: now() });
      send(res, 200, hackathon);
      return;
    }
    if (req.method === "DELETE") {
      requireAdmin(req, res);
      if (res.writableEnded) return;
      hackathons.splice(hackathons.indexOf(hackathon), 1);
      send(res, 204);
      return;
    }
  }

  const activateMatch = path.match(/^\/hackathons\/([^/]+)\/activate$/);
  if (activateMatch && req.method === "POST") {
    requireAdmin(req, res);
    if (res.writableEnded) return;
    const hackathon = hackathons.find((item) => item.id === activateMatch[1]);
    if (!hackathon) return notFound(res);
    hackathons.forEach((item) => {
      if (item.status === "active") {
        item.status = "archived";
        item.updatedAt = now();
      }
    });
    hackathon.status = "active";
    hackathon.updatedAt = now();
    send(res, 200, hackathon);
    return;
  }

  const rulesMatch = path.match(/^\/hackathons\/([^/]+)\/rules$/);
  if (rulesMatch && req.method === "PUT") {
    requireAssignedOrganizer(req, res, rulesMatch[1]);
    if (res.writableEnded) return;
    const hackathon = hackathons.find((item) => item.id === rulesMatch[1]);
    if (!hackathon) return notFound(res);
    const uploaded = {
      id: randomUUID(),
      url: `http://127.0.0.1:${port}/mock-rules-${Date.now()}.pdf`,
      originalName: "rules.pdf",
      mimeType: "application/pdf",
      sizeBytes: Number(req.headers["content-length"] ?? 0),
      createdAt: now(),
    };
    files.push(uploaded);
    hackathon.rulesFile = uploaded;
    hackathon.updatedAt = now();
    send(res, 200, hackathon);
    return;
  }

  const formFieldsMatch = path.match(/^\/hackathons\/([^/]+)\/form-fields$/);
  if (formFieldsMatch) {
    const hackathonId = formFieldsMatch[1];
    if (req.method === "GET") {
      const scope = url.searchParams.get("scope");
      const items = formFields.filter((item) => item.hackathonId === hackathonId && (!scope || item.scope === scope));
      send(res, 200, items);
      return;
    }
    if (req.method === "POST") {
      requireAssignedOrganizer(req, res, hackathonId);
      if (res.writableEnded) return;
      const created = { id: randomUUID(), hackathonId, required: false, visible: true, order: 0, options: [], validation: {}, ...body };
      formFields.push(created);
      send(res, 201, created);
      return;
    }
  }

  const formFieldMatch = path.match(/^\/hackathons\/([^/]+)\/form-fields\/([^/]+)$/);
  if (formFieldMatch) {
    requireAssignedOrganizer(req, res, formFieldMatch[1]);
    if (res.writableEnded) return;
    const field = formFields.find((item) => item.id === formFieldMatch[2]);
    if (!field) return notFound(res);
    if (req.method === "PATCH") {
      Object.assign(field, body);
      send(res, 200, field);
      return;
    }
    if (req.method === "DELETE") {
      field.visible = false;
      send(res, 204);
      return;
    }
  }

  const registrationsMatch = path.match(/^\/hackathons\/([^/]+)\/registrations$/);
  if (registrationsMatch && req.method === "GET") {
    requireAssignedOrganizer(req, res, registrationsMatch[1]);
    if (res.writableEnded) return;
    send(res, 200, page(
      teams
        .filter((team) => team.hackathonId === registrationsMatch[1])
        .map((team) => ({ team, submittedAt: team.submittedAt })),
      url,
    ));
    return;
  }

  const teamsMatch = path.match(/^\/hackathons\/([^/]+)\/teams$/);
  if (teamsMatch) {
    if (req.method === "GET") {
      const status = url.searchParams.get("status");
      const items = teams.filter((team) =>
        team.hackathonId === teamsMatch[1] && (!status || team.status === status)
      );
      send(res, 200, page(items, url));
      return;
    }
    if (req.method === "POST") {
      requireUser(req, res);
      if (res.writableEnded) return;
      const invitationLinks = [];
      const created = {
        id: randomUUID(),
        hackathonId: teamsMatch[1],
        name: body.name ?? "Новая команда",
        status: "submitted",
        members: (body.members ?? []).map((member) => {
          const memberId = randomUUID();
          const existingUser = member.kind === "existing_user"
            ? users.find((item) => item.login === member.login) ?? users[2]
            : null;
          const invite = member.kind === "new_user"
            ? {
              token: `invite-${memberId.slice(0, 8)}`,
              hackathonId: teamsMatch[1],
              teamId: "",
              memberId,
              fullName: member.fullName,
              email: member.email ?? null,
              status: "pending",
              prefilledProfileFields: member.profileFields ?? {},
              expiresAt: "2026-12-31T23:59:59.000Z",
            }
            : null;
          if (invite) {
            invitations.push(invite);
            invitationLinks.push({
              memberId,
              url: `http://127.0.0.1:${port}/invite/${invite.token}`,
            });
          }
          return {
            id: memberId,
            user: existingUser ? publicUser(existingUser) : null,
            source: member.kind === "existing_user" ? "existing_user" : "invited_new_user",
            login: member.login ?? null,
            fullName: existingUser?.fullName ?? member.fullName ?? member.login ?? "Участник",
            email: member.email ?? null,
            captain: Boolean(member.captain),
            status: member.kind === "existing_user" ? "active" : "pending_invitation",
            invitation: invite,
            profileFields: member.profileFields ?? {},
          };
        }),
        submittedAt: now(),
        moderationReason: null,
        createdAt: now(),
        updatedAt: now(),
      };
      created.members.forEach((member) => {
        if (member.invitation) member.invitation.teamId = created.id;
      });
      teams.push(created);
      send(res, 201, { team: created, invitationLinks });
      return;
    }
  }

  const myTeamMatch = path.match(/^\/hackathons\/([^/]+)\/teams\/me$/);
  if (myTeamMatch && req.method === "GET") {
    requireUser(req, res);
    if (res.writableEnded) return;
    const found = teams.find((team) => team.hackathonId === myTeamMatch[1]);
    found ? send(res, 200, found) : notFound(res);
    return;
  }

  const teamMatch = path.match(/^\/hackathons\/([^/]+)\/teams\/([^/]+)$/);
  if (teamMatch) {
    const team = teams.find((item) => item.id === teamMatch[2]);
    if (!team) return notFound(res);
    if (req.method === "GET") {
      send(res, 200, team);
      return;
    }
    if (req.method === "PATCH") {
      Object.assign(team, body, { updatedAt: now() });
      send(res, 200, team);
      return;
    }
    if (req.method === "DELETE") {
      teams.splice(teams.indexOf(team), 1);
      send(res, 204);
      return;
    }
  }

  const teamStatusMatch = path.match(/^\/hackathons\/([^/]+)\/teams\/([^/]+)\/status$/);
  if (teamStatusMatch && req.method === "PATCH") {
    requireAssignedOrganizer(req, res, teamStatusMatch[1]);
    if (res.writableEnded) return;
    const team = teams.find((item) => item.id === teamStatusMatch[2]);
    if (!team) return notFound(res);
    team.status = body.status ?? team.status;
    team.moderationReason = body.reason ?? team.moderationReason;
    team.updatedAt = now();
    send(res, 200, team);
    return;
  }

  const memberActionMatch = path.match(/^\/hackathons\/([^/]+)\/teams\/([^/]+)\/members\/([^/]+)(?:\/(captain|disqualify))?$/);
  if (memberActionMatch) {
    const team = teams.find((item) => item.id === memberActionMatch[2]);
    if (!team) return notFound(res);
    const member = team.members.find((item) => item.id === memberActionMatch[3]);
    if (!member) return notFound(res);
    const action = memberActionMatch[4];
    if (req.method === "DELETE" && !action) {
      team.members = team.members.filter((item) => item.id !== member.id);
      send(res, 204);
      return;
    }
    if (req.method === "PUT" && action === "captain") {
      team.members.forEach((item) => {
        item.captain = item.id === member.id;
      });
      send(res, 200, team);
      return;
    }
    if (req.method === "POST" && action === "disqualify") {
      requireAssignedOrganizer(req, res, memberActionMatch[1]);
      if (res.writableEnded) return;
      member.status = "disqualified";
      send(res, 200, team);
      return;
    }
  }

  const invitationMatch = path.match(/^\/invitations\/([^/]+)(?:\/(accept-existing|complete-registration))?$/);
  if (invitationMatch) {
    const invitation = invitations.find((item) => item.token === invitationMatch[1]);
    if (!invitation) return notFound(res);
    if (req.method === "GET" && !invitationMatch[2]) {
      send(res, 200, invitation);
      return;
    }
    if (req.method === "POST" && invitationMatch[2] === "accept-existing") {
      requireUser(req, res);
      if (res.writableEnded) return;
      invitation.status = "accepted";
      send(res, 200, teams.find((item) => item.id === invitation.teamId));
      return;
    }
    if (req.method === "POST" && invitationMatch[2] === "complete-registration") {
      const created = user({ email: body.email, fullName: body.fullName, password: body.password, role: "participant", profileFields: body.profileFields ?? {} });
      users.push(created);
      invitation.status = "accepted";
      send(res, 201, { user: created, tokens: tokensFor(created) });
      return;
    }
  }

  const feedbackMatch = path.match(/^\/hackathons\/([^/]+)\/feedback$/);
  if (feedbackMatch) {
    if (req.method === "GET") {
      requireAssignedOrganizer(req, res, feedbackMatch[1]);
      if (res.writableEnded) return;
      send(res, 200, page(feedback.filter((item) => item.hackathonId === feedbackMatch[1]), url));
      return;
    }
    if (req.method === "POST") {
      const current = requireUser(req, res);
      if (!current) return;
      const created = { id: randomUUID(), hackathonId: feedbackMatch[1], userId: current.id, fields: body.fields ?? {}, createdAt: now() };
      feedback.push(created);
      send(res, 201, created);
      return;
    }
  }

  if (path === "/files" && req.method === "POST") {
    const created = { id: randomUUID(), url: `http://127.0.0.1:${port}/mock-file`, originalName: "upload.bin", mimeType: "application/octet-stream", sizeBytes: 0, createdAt: now() };
    files.push(created);
    send(res, 201, created);
    return;
  }

  const fileMatch = path.match(/^\/files\/([^/]+)$/);
  if (fileMatch && req.method === "GET") {
    const found = files.find((item) => item.id === fileMatch[1]);
    found ? send(res, 200, found) : notFound(res);
    return;
  }

  const exportMatch = path.match(/^\/hackathons\/([^/]+)\/exports\/teams$/);
  if (exportMatch && req.method === "GET") {
    requireAssignedOrganizer(req, res, exportMatch[1]);
    if (res.writableEnded) return;
    send(res, 200, "team,status\nКоманда Демо,submitted\n", { "Content-Type": "text/csv; charset=utf-8" });
    return;
  }

  notFound(res);
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type,Accept");

  if (req.method === "OPTIONS") {
    send(res, 204);
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
  const path = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) || "/" : url.pathname;

  try {
    const body = await readBody(req);
    if (await handleLegacy(req, res, url, path, body)) return;
    await handleApi(req, res, url, path, body);
  } catch (error) {
    console.error(error);
    send(res, 500, { code: "internal_error", message: "Ошибка mock backend" });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock backend listening on http://127.0.0.1:${port}${basePath}`);
  console.log("Demo users: admin@example.test, organizer@example.test, participant@example.test; password: password");
});
