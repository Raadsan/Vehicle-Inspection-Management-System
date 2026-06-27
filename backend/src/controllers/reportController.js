// src/controllers/reportController.js
import { prisma } from "../lib/prisma.js";

export const createReport = async (req, res) => {
  try {
    const { companyId, title, content, generatedAt } = req.body;
    const report = await prisma.report.create({
      data: {
        companyId,
        title,
        content,
        generatedAt: generatedAt ?? new Date(),
      },
    });
    res.status(201).json(report);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { companyId } = req.query;
    const reports = await prisma.report.findMany({
      where: companyId ? { companyId: Number(companyId) } : undefined,
      orderBy: { generatedAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
    });
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updated = await prisma.report.update({
      where: { id: Number(id) },
      data: { title, content },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Report not found" });
    console.error('Update report error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    await prisma.report.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Report not found" });
    console.error('Delete report error:', err);
    res.status(500).json({ error: err.message });
  }
};
