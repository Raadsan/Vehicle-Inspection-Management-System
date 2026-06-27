import { prisma } from "../lib/prisma.js";

// Create a new inspector
export const createInspector = async (req, res) => {
  try {
    const { companyId, name, email, phone } = req.body;
    const inspector = await prisma.inspector.create({
      data: { companyId, name, email, phone },
    });
    res.status(201).json(inspector);
  } catch (error) {
    console.error('Create Inspector error:', error);
    res.status(500).json({ error: 'Failed to create inspector' });
  }
};

// Get all inspectors (optional filter by company)
export const getInspectors = async (req, res) => {
  try {
    const { companyId } = req.query;
    const inspectors = await prisma.inspector.findMany({
      where: companyId ? { companyId: Number(companyId) } : undefined,
      include: { company: true },
    });
    res.json(inspectors);
  } catch (error) {
    console.error('Get Inspectors error:', error);
    res.status(500).json({ error: 'Failed to fetch inspectors' });
  }
};

// Get inspector by ID
export const getInspectorById = async (req, res) => {
  try {
    const { id } = req.params;
    const inspector = await prisma.inspector.findUnique({
      where: { id: Number(id) },
      include: { company: true },
    });
    if (!inspector) return res.status(404).json({ error: 'Inspector not found' });
    res.json(inspector);
  } catch (error) {
    console.error('Get Inspector by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch inspector' });
  }
};

// Update inspector
export const updateInspector = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const inspector = await prisma.inspector.update({
      where: { id: Number(id) },
      data,
    });
    res.json(inspector);
  } catch (error) {
    console.error('Update Inspector error:', error);
    res.status(500).json({ error: 'Failed to update inspector' });
  }
};

// Delete inspector
export const deleteInspector = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.inspector.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete Inspector error:', error);
    res.status(500).json({ error: 'Failed to delete inspector' });
  }
};
