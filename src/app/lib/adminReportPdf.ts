import { jsPDF } from "jspdf";
import liasLogo from "../../assets/lias-logo-transparent.png";
import uh2cLogo from "../../assets/uh2c-logo.png";
import type { LabEvent, NewsItem, ResearchAxis, User } from "./api";

interface AdminReportPayload {
  generatedBy: string;
  users: User[];
  axes: ResearchAxis[];
  events: LabEvent[];
  news: NewsItem[];
  queueCount: number;
}

interface AdminDashboardReportPayload {
  generatedBy: string;
  stats: Array<{ label: string; value: number; trend: string }>;
  submissionTrend: Array<{ month: string; validations: number; submissions: number }>;
  recentActivities: Array<{
    action: string;
    title: string;
    date: string;
    status: string;
    user?: string | null;
  }>;
}

const page = {
  width: 210,
  height: 297,
  margin: 14,
};

async function imageToDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function text(doc: jsPDF, value: string, x: number, y: number, options?: { maxWidth?: number; lineHeight?: number }) {
  const maxWidth = options?.maxWidth;
  const lines = maxWidth ? doc.splitTextToSize(value, maxWidth) : [value];
  doc.text(lines, x, y);
  return y + lines.length * (options?.lineHeight ?? 5);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(220, 226, 235);
    doc.line(page.margin, 284, page.width - page.margin, 284);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Plateforme scientifique LIAS - Rapport genere automatiquement", page.margin, 290);
    doc.text(`Page ${i}/${pageCount}`, page.width - page.margin, 290, { align: "right" });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed = 28) {
  if (y + needed <= 278) return y;
  doc.addPage();
  return 20;
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  y = ensureSpace(doc, y, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(13, 30, 64);
  doc.text(title, page.margin, y);
  doc.setDrawColor(8, 145, 178);
  doc.setLineWidth(0.7);
  doc.line(page.margin, y + 3, page.margin + 42, y + 3);
  return y + 11;
}

function addKpiCard(doc: jsPDF, label: string, value: string | number, detail: string, x: number, y: number, width: number) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(x, y, width, 28, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(13, 30, 64);
  doc.text(String(value), x + 5, y + 10);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(label, x + 5, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(detail, x + 5, y + 23);
}

function addSimpleTable(doc: jsPDF, headers: string[], rows: string[][], y: number, widths: number[]) {
  y = ensureSpace(doc, y, 18);
  const x = page.margin;
  const rowHeight = 8;
  let cursorX = x;

  doc.setFillColor(13, 30, 64);
  doc.rect(x, y, widths.reduce((sum, width) => sum + width, 0), rowHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  headers.forEach((header, index) => {
    doc.text(header, cursorX + 2, y + 5.4);
    cursorX += widths[index];
  });
  y += rowHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  rows.forEach((row, rowIndex) => {
    y = ensureSpace(doc, y, rowHeight + 4);
    doc.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 252);
    doc.rect(x, y, widths.reduce((sum, width) => sum + width, 0), rowHeight, "F");
    cursorX = x;
    row.forEach((cell, index) => {
      doc.setTextColor(30, 41, 59);
      const value = String(cell || "-");
      const clipped = value.length > 54 ? `${value.slice(0, 51)}...` : value;
      doc.text(clipped, cursorX + 2, y + 5.3, { maxWidth: widths[index] - 4 });
      cursorX += widths[index];
    });
    y += rowHeight;
  });

  return y + 5;
}

export async function exportAdminReportPdf(payload: AdminReportPayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await imageToDataUrl(liasLogo);
  const universityLogo = await imageToDataUrl(uh2cLogo);
  const now = new Date();
  const adminCount = payload.users.filter((account) => account.role === "admin").length;
  const memberCount = payload.users.length - adminCount;
  const publishedNews = payload.news.filter((item) => item.is_published).length;
  const upcomingEvents = payload.events.filter((event) => event.lifecycle_status === "upcoming").length;

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, page.width, page.height, "F");

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(page.margin, 12, page.width - page.margin * 2, 34, 2.5, 2.5, "FD");

  if (universityLogo) {
    doc.addImage(universityLogo, "PNG", 18, 17, 33, 25, undefined, "FAST");
  }
  doc.setTextColor(13, 30, 64);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Faculte des Sciences Ben M'Sik", 56, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Universite Hassan II de Casablanca", 56, 30);
  doc.text("Laboratoire d'Intelligence Artificielle et Systemes", 56, 35);

  if (logo) {
    doc.addImage(logo, "PNG", 151, 19, 42, 20, undefined, "FAST");
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(13, 30, 64);
    doc.text("LIAS", 184, 32, { align: "right" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(13, 30, 64);
  doc.text("Rapport administratif du laboratoire", page.margin, 62);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Genere le ${now.toLocaleDateString("fr-FR")} a ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, page.margin, 69);
  doc.text(`Responsable export : ${payload.generatedBy}`, page.margin, 75);

  let y = 88;
  const gap = 5;
  const cardWidth = (page.width - page.margin * 2 - gap * 3) / 4;
  addKpiCard(doc, "Utilisateurs", payload.users.length, `${adminCount} admins / ${memberCount} membres`, page.margin, y, cardWidth);
  addKpiCard(doc, "Axes", payload.axes.length, "Structuration scientifique", page.margin + (cardWidth + gap), y, cardWidth);
  addKpiCard(doc, "Evenements", payload.events.length, `${upcomingEvents} a venir`, page.margin + (cardWidth + gap) * 2, y, cardWidth);
  addKpiCard(doc, "Moderation", payload.queueCount, "Elements en attente", page.margin + (cardWidth + gap) * 3, y, cardWidth);
  y += 42;

  y = addSectionTitle(doc, "Synthese institutionnelle", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  y = text(
    doc,
    `Ce rapport presente une vue de pilotage du portail LIAS : comptes utilisateurs, axes de recherche, evenements, actualites et etat de moderation. Il est genere automatiquement depuis les donnees de la plateforme afin d'appuyer le suivi administratif et scientifique du laboratoire.`,
    page.margin,
    y,
    { maxWidth: 182, lineHeight: 5 },
  ) + 4;

  y = addSectionTitle(doc, "Repartition des utilisateurs", y);
  y = addSimpleTable(
    doc,
    ["Indicateur", "Valeur", "Observation"],
    [
      ["Comptes administrateurs", String(adminCount), "Gestion et validation des contenus"],
      ["Comptes membres", String(memberCount), "Chercheurs, doctorants et contributeurs"],
      ["Total utilisateurs", String(payload.users.length), "Comptes actifs dans la plateforme"],
    ],
    y,
    [58, 34, 90],
  );

  y = addSectionTitle(doc, "Axes de recherche", y);
  y = addSimpleTable(
    doc,
    ["Axe", "Responsable"],
    payload.axes.slice(0, 8).map((axis) => [axis.title, axis.lead_member_name || "Non renseigne"]),
    y,
    [118, 64],
  );

  y = addSectionTitle(doc, "Evenements scientifiques", y);
  y = addSimpleTable(
    doc,
    ["Titre", "Date", "Statut"],
    payload.events.slice(0, 8).map((event) => [
      event.title,
      new Date(event.start_date).toLocaleDateString("fr-FR"),
      event.lifecycle_status === "upcoming" ? "A venir" : "Passe",
    ]),
    y,
    [112, 35, 35],
  );

  y = addSectionTitle(doc, "Actualites", y);
  y = addSimpleTable(
    doc,
    ["Titre", "Publication", "Validation"],
    payload.news.slice(0, 8).map((item) => [
      item.title,
      item.is_published ? "Publiee" : "Brouillon",
      item.validation_status,
    ]),
    y,
    [112, 35, 35],
  );

  y = addSectionTitle(doc, "Conclusion", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  text(
    doc,
    `Etat courant : ${payload.queueCount} element(s) attendent une action de moderation. ${publishedNews} actualite(s) sont publiees et ${upcomingEvents} evenement(s) sont planifies.`,
    page.margin,
    y,
    { maxWidth: 182, lineHeight: 5 },
  );

  addFooter(doc);
  doc.save(`rapport-administratif-lias-${now.toISOString().slice(0, 10)}.pdf`);
}

export async function exportAdminDashboardPdf(payload: AdminDashboardReportPayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await imageToDataUrl(liasLogo);
  const universityLogo = await imageToDataUrl(uh2cLogo);
  const now = new Date();

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, page.width, page.height, "F");

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(page.margin, 12, page.width - page.margin * 2, 34, 2.5, 2.5, "FD");

  if (universityLogo) {
    doc.addImage(universityLogo, "PNG", 18, 17, 33, 25, undefined, "FAST");
  }
  doc.setTextColor(13, 30, 64);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Faculte des Sciences Ben M'Sik", 56, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Universite Hassan II de Casablanca", 56, 30);
  doc.text("Laboratoire d'Intelligence Artificielle et Systemes", 56, 35);

  if (logo) {
    doc.addImage(logo, "PNG", 151, 19, 42, 20, undefined, "FAST");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(13, 30, 64);
  doc.text("Bilan laboratoire LIAS", page.margin, 62);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Genere le ${now.toLocaleDateString("fr-FR")} a ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, page.margin, 69);
  doc.text(`Responsable export : ${payload.generatedBy}`, page.margin, 75);

  let y = 88;
  const gap = 5;
  const cardWidth = (page.width - page.margin * 2 - gap * 3) / 4;
  payload.stats.slice(0, 4).forEach((stat, index) => {
    addKpiCard(doc, stat.label, stat.value, stat.trend, page.margin + (cardWidth + gap) * index, y, cardWidth);
  });
  y += 42;

  y = addSectionTitle(doc, "Lecture generale", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  y = text(
    doc,
    "Ce document synthetise les indicateurs du tableau de bord administrateur : production scientifique, comptes membres, elements en moderation, projets actifs et activites recentes.",
    page.margin,
    y,
    { maxWidth: 182, lineHeight: 5 },
  ) + 5;

  y = addSectionTitle(doc, "Evolution des soumissions et validations", y);
  y = addSimpleTable(
    doc,
    ["Mois", "Soumissions", "Validations"],
    payload.submissionTrend.map((point) => [
      point.month,
      String(point.submissions),
      String(point.validations),
    ]),
    y,
    [60, 60, 62],
  );

  y = addSectionTitle(doc, "Activites recentes", y);
  y = addSimpleTable(
    doc,
    ["Action", "Element", "Date"],
    payload.recentActivities.slice(0, 10).map((activity) => [
      activity.action,
      activity.title,
      activity.date,
    ]),
    y,
    [58, 86, 38],
  );

  y = addSectionTitle(doc, "Conclusion", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  text(
    doc,
    "Le bilan PDF fournit une trace exploitable des indicateurs administratifs et peut etre joint au rapport de suivi ou presente pendant les reunions d'encadrement.",
    page.margin,
    y,
    { maxWidth: 182, lineHeight: 5 },
  );

  addFooter(doc);
  doc.save(`bilan-laboratoire-lias-${now.toISOString().slice(0, 10)}.pdf`);
}
