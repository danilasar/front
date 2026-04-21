import type { Team, TeamMember, TeamStatus } from "./types";

export type TeamExportRow = {
  team: string;
  status: string;
  captain: string;
  members: string;
  submittedAt: string;
  reason: string;
};

const headers: Array<keyof TeamExportRow> = ["team", "status", "captain", "members", "submittedAt", "reason"];

const headerLabels: Record<keyof TeamExportRow, string> = {
  team: "Команда",
  status: "Статус",
  captain: "Капитан",
  members: "Состав",
  submittedAt: "Дата подачи",
  reason: "Причина",
};

const teamStatusLabels: Record<TeamStatus, string> = {
  draft: "Черновик",
  submitted: "На рассмотрении",
  admitted: "Допущена",
  rejected: "Отклонена",
  disqualified: "Дисквалифицирована",
  withdrawn: "Снята",
};

const teamMemberStatusLabels: Record<TeamMember["status"], string> = {
  active: "Активен",
  pending_invitation: "Ждет приглашение",
  disqualified: "Дисквалифицирован",
};

const getTeamCaptain = (team: Pick<Team, "members">): TeamMember | null =>
  team.members.find((member) => member.captain) ?? null;

const formatTeamDate = (value: string | null): string => {
  if (!value) return "Не подана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const buildTeamExportRows = (teams: Team[]): TeamExportRow[] =>
  teams.map((team) => {
    const captain = getTeamCaptain(team);
    return {
      team: team.name,
      status: teamStatusLabels[team.status],
      captain: captain?.fullName ?? "",
      members: team.members
        .map((member) => `${member.fullName}${member.captain ? " (капитан)" : ""} - ${teamMemberStatusLabels[member.status]}`)
        .join("; "),
      submittedAt: formatTeamDate(team.submittedAt),
      reason: team.moderationReason ?? "",
    };
  });

const escapeCsvField = (value: string): string => {
  if (!/[",\n\r;]/.test(value)) return value;
  return `"${value.replaceAll("\"", "\"\"")}"`;
};

export const buildTeamsCsv = (teams: Team[]): string => {
  const rows = buildTeamExportRows(teams);
  const lines = [
    headers.map((header) => escapeCsvField(headerLabels[header])).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvField(row[header])).join(",")),
  ];
  return `\uFEFF${lines.join("\n")}\n`;
};

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");

const columnName = (index: number): string => {
  let value = index + 1;
  let name = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
};

const worksheetCell = (rowIndex: number, columnIndex: number, value: string): string =>
  `<c r="${columnName(columnIndex)}${rowIndex}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;

const buildWorksheetXml = (teams: Team[]): string => {
  const rows = buildTeamExportRows(teams);
  const headerRow = `<row r="1">${headers.map((header, index) => worksheetCell(1, index, headerLabels[header])).join("")}</row>`;
  const dataRows = rows.map((row, rowIndex) => {
    const excelRow = rowIndex + 2;
    return `<row r="${excelRow}">${headers.map((header, columnIndex) => worksheetCell(excelRow, columnIndex, row[header])).join("")}</row>`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${headerRow}${dataRows.join("")}</sheetData>
</worksheet>`;
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const crc32 = (data: Uint8Array): number => {
  let crc = 0xFFFFFFFF;
  data.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  });
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

const writeUint16 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value & 0xFF;
  target[offset + 1] = (value >>> 8) & 0xFF;
};

const writeUint32 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value & 0xFF;
  target[offset + 1] = (value >>> 8) & 0xFF;
  target[offset + 2] = (value >>> 16) & 0xFF;
  target[offset + 3] = (value >>> 24) & 0xFF;
};

const concatBytes = (parts: Uint8Array[]): Uint8Array => {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });

  return result;
};

const buildZip = (files: Array<{ path: string; content: string }>): Uint8Array => {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const name = encoder.encode(file.path);
    const data = encoder.encode(file.content);
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + name.length);
    writeUint32(localHeader, 0, 0x04034B50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, 0);
    writeUint16(localHeader, 12, 0);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, data.length);
    writeUint32(localHeader, 22, data.length);
    writeUint16(localHeader, 26, name.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(name, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + name.length);
    writeUint32(centralHeader, 0, 0x02014B50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, 0);
    writeUint16(centralHeader, 14, 0);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, data.length);
    writeUint32(centralHeader, 24, data.length);
    writeUint16(centralHeader, 28, name.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(name, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054B50);
  writeUint16(end, 4, 0);
  writeUint16(end, 6, 0);
  writeUint16(end, 8, files.length);
  writeUint16(end, 10, files.length);
  writeUint32(end, 12, centralDirectory.length);
  writeUint32(end, 16, offset);
  writeUint16(end, 20, 0);

  return concatBytes([...localParts, centralDirectory, end]);
};

export const buildTeamsXlsx = (teams: Team[]): Blob => {
  const files = [
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      path: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Заявки" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    {
      path: "xl/worksheets/sheet1.xml",
      content: buildWorksheetXml(teams),
    },
  ];

  const zip = buildZip(files);
  const buffer = new ArrayBuffer(zip.byteLength);
  new Uint8Array(buffer).set(zip);

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};
