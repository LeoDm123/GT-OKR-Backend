const OKR = require("../models/okr-model");

// Crear un nuevo OKR
const createOKR = async (req, res) => {
  try {
    const {
      title,
      description,
      owner,
      period,
      year,
      startDate,
      endDate,
      keyResults,
      category,
      tags,
      notes,
      team,
      visibility,
    } = req.body;

    // Validaciones básicas
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({
        msg: "El título es requerido y debe tener al menos 3 caracteres",
      });
    }

    if (!owner) {
      return res
        .status(400)
        .json({ msg: "El propietario (owner) es requerido" });
    }

    if (
      !period ||
      !["Q1", "Q2", "Q3", "Q4", "annual", "custom"].includes(period)
    ) {
      return res.status(400).json({
        msg: "El período es requerido y debe ser: Q1, Q2, Q3, Q4, annual o custom",
      });
    }

    if (!year || typeof year !== "number" || year < 2000 || year > 2100) {
      return res.status(400).json({
        msg: "El año es requerido y debe ser un número válido",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        msg: "Las fechas de inicio y fin son requeridas",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ msg: "Las fechas deben ser válidas" });
    }

    if (start >= end) {
      return res.status(400).json({
        msg: "La fecha de inicio debe ser anterior a la fecha de fin",
      });
    }

    // Validar Key Results si se proporcionan
    if (keyResults && Array.isArray(keyResults)) {
      for (const kr of keyResults) {
        if (
          !kr.title ||
          typeof kr.title !== "string" ||
          kr.title.trim().length < 3
        ) {
          return res.status(400).json({
            msg: "Cada Key Result debe tener un título de al menos 3 caracteres",
          });
        }
        if (
          kr.targetValue === undefined ||
          typeof kr.targetValue !== "number"
        ) {
          return res.status(400).json({
            msg: "Cada Key Result debe tener un valor objetivo numérico",
          });
        }
      }
    }

    const okr = new OKR({
      title: title.trim(),
      description: description?.trim() || "",
      owner,
      period,
      year,
      startDate: start,
      endDate: end,
      keyResults: keyResults || [],
      category: category?.trim() || "",
      tags: tags || [],
      notes: notes?.trim() || "",
      team: team?.trim() || "",
      visibility: visibility || "private",
      status: "draft",
    });

    await okr.save();

    // Populate owner para devolver datos completos
    await okr.populate("owner", "email personalData");

    res.status(201).json({
      msg: "OKR creado con éxito",
      okr,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al crear el OKR",
      error: error.message,
    });
  }
};

// Obtener todos los OKR (con filtros opcionales)
const getOKRs = async (req, res) => {
  try {
    const {
      owner,
      period,
      year,
      status,
      category,
      team,
      visibility,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (owner) query.owner = owner;
    if (period) query.period = period;
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (category) query.category = category;
    if (team) query.team = team;
    if (visibility) query.visibility = visibility;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const okrs = await OKR.find(query)
      .populate("owner", "email personalData")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OKR.countDocuments(query);

    res.status(200).json({
      okrs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al obtener los OKR",
      error: error.message,
    });
  }
};

// Obtener un OKR por ID
const getOKRById = async (req, res) => {
  try {
    const { id } = req.params;

    const okr = await OKR.findById(id).populate("owner", "email personalData");

    if (!okr) {
      return res.status(404).json({ msg: "OKR no encontrado" });
    }

    res.status(200).json(okr);
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "ID de OKR inválido" });
    }
    res.status(500).json({
      msg: "Hubo un problema al obtener el OKR",
      error: error.message,
    });
  }
};

// Obtener OKR por usuario (owner)
const getOKRsByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { status, period, year } = req.query;

    const query = { owner: ownerId };

    if (status) query.status = status;
    if (period) query.period = period;
    if (year) query.year = parseInt(year);

    const okrs = await OKR.find(query)
      .populate("owner", "email personalData")
      .sort({ createdAt: -1 });

    res.status(200).json({ okrs, count: okrs.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al obtener los OKR del usuario",
      error: error.message,
    });
  }
};

// Actualizar un OKR
const updateOKR = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validar fechas si se proporcionan
    if (updateData.startDate || updateData.endDate) {
      const okr = await OKR.findById(id);
      if (!okr) {
        return res.status(404).json({ msg: "OKR no encontrado" });
      }

      const start = updateData.startDate
        ? new Date(updateData.startDate)
        : okr.startDate;
      const end = updateData.endDate
        ? new Date(updateData.endDate)
        : okr.endDate;

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ msg: "Las fechas deben ser válidas" });
      }

      if (start >= end) {
        return res.status(400).json({
          msg: "La fecha de inicio debe ser anterior a la fecha de fin",
        });
      }
    }

    // Validar período si se proporciona
    if (
      updateData.period &&
      !["Q1", "Q2", "Q3", "Q4", "annual", "custom"].includes(updateData.period)
    ) {
      return res.status(400).json({
        msg: "El período debe ser: Q1, Q2, Q3, Q4, annual o custom",
      });
    }

    // Validar estado si se proporciona
    if (
      updateData.status &&
      !["draft", "active", "completed", "paused", "cancelled"].includes(
        updateData.status
      )
    ) {
      return res.status(400).json({
        msg: "El estado debe ser: draft, active, completed, paused o cancelled",
      });
    }

    const updatedOKR = await OKR.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("owner", "email personalData");

    if (!updatedOKR) {
      return res.status(404).json({ msg: "OKR no encontrado" });
    }

    res.status(200).json({
      msg: "OKR actualizado con éxito",
      okr: updatedOKR,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "ID de OKR inválido" });
    }
    res.status(500).json({
      msg: "Hubo un problema al actualizar el OKR",
      error: error.message,
    });
  }
};

// Eliminar un OKR
const deleteOKR = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOKR = await OKR.findByIdAndDelete(id);

    if (!deletedOKR) {
      return res.status(404).json({ msg: "OKR no encontrado" });
    }

    res.status(200).json({ msg: "OKR eliminado con éxito" });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "ID de OKR inválido" });
    }
    res.status(500).json({
      msg: "Hubo un problema al eliminar el OKR",
      error: error.message,
    });
  }
};

// Agregar un Key Result a un OKR
const addKeyResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, targetValue, unit } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({
        msg: "El título es requerido y debe tener al menos 3 caracteres",
      });
    }

    if (targetValue === undefined || typeof targetValue !== "number") {
      return res.status(400).json({
        msg: "El valor objetivo es requerido y debe ser un número",
      });
    }

    const okr = await OKR.findById(id);

    if (!okr) {
      return res.status(404).json({ msg: "OKR no encontrado" });
    }

    const newKeyResult = {
      title: title.trim(),
      description: description?.trim() || "",
      targetValue,
      currentValue: 0,
      unit: unit?.trim() || "",
      progress: 0,
      status: "not_started",
    };

    okr.keyResults.push(newKeyResult);
    await okr.save();

    await okr.populate("owner", "email personalData");

    res.status(200).json({
      msg: "Key Result agregado con éxito",
      okr,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "ID de OKR inválido" });
    }
    res.status(500).json({
      msg: "Hubo un problema al agregar el Key Result",
      error: error.message,
    });
  }
};

// Actualizar un Key Result específico
const updateKeyResult = async (req, res) => {
  try {
    const { id, keyResultId } = req.params;
    const updateData = req.body;

    const okr = await OKR.findById(id);

    if (!okr) {
      return res.status(404).json({ msg: "OKR no encontrado" });
    }

    const keyResult = okr.keyResults.id(keyResultId);

    if (!keyResult) {
      return res.status(404).json({ msg: "Key Result no encontrado" });
    }

    // Actualizar campos permitidos
    if (updateData.title !== undefined) {
      if (
        typeof updateData.title !== "string" ||
        updateData.title.trim().length < 3
      ) {
        return res.status(400).json({
          msg: "El título debe tener al menos 3 caracteres",
        });
      }
      keyResult.title = updateData.title.trim();
    }

    if (updateData.description !== undefined) {
      keyResult.description = updateData.description?.trim() || "";
    }

    if (updateData.targetValue !== undefined) {
      if (typeof updateData.targetValue !== "number") {
        return res.status(400).json({
          msg: "El valor objetivo debe ser un número",
        });
      }
      keyResult.targetValue = updateData.targetValue;
    }

    if (updateData.currentValue !== undefined) {
      if (typeof updateData.currentValue !== "number") {
        return res.status(400).json({
          msg: "El valor actual debe ser un número",
        });
      }
      keyResult.currentValue = updateData.currentValue;
    }

    if (updateData.unit !== undefined) {
      keyResult.unit = updateData.unit?.trim() || "";
    }

    if (updateData.status !== undefined) {
      if (
        !["not_started", "in_progress", "completed", "at_risk"].includes(
          updateData.status
        )
      ) {
        return res.status(400).json({
          msg: "El estado debe ser: not_started, in_progress, completed o at_risk",
        });
      }
      keyResult.status = updateData.status;
    }

    // Calcular progreso automáticamente si se actualiza currentValue o targetValue
    if (
      updateData.currentValue !== undefined ||
      updateData.targetValue !== undefined
    ) {
      if (keyResult.targetValue > 0) {
        keyResult.progress = Math.min(
          100,
          Math.max(
            0,
            Math.round((keyResult.currentValue / keyResult.targetValue) * 100)
          )
        );
      } else {
        keyResult.progress = 0;
      }

      // Actualizar estado basado en progreso
      if (keyResult.progress >= 100) {
        keyResult.status = "completed";
        if (!keyResult.completedAt) {
          keyResult.completedAt = new Date();
        }
      } else if (keyResult.progress > 0) {
        if (keyResult.status === "not_started") {
          keyResult.status = "in_progress";
        }
      }
    }

    // Si se marca como completado manualmente
    if (updateData.status === "completed" && keyResult.progress < 100) {
      keyResult.progress = 100;
      keyResult.currentValue = keyResult.targetValue;
      keyResult.completedAt = new Date();
    }

    await okr.save();
    await okr.populate("owner", "email personalData");

    res.status(200).json({
      msg: "Key Result actualizado con éxito",
      okr,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "ID inválido" });
    }
    res.status(500).json({
      msg: "Hubo un problema al actualizar el Key Result",
      error: error.message,
    });
  }
};

// Eliminar un Key Result
const deleteKeyResult = async (req, res) => {
  try {
    const { id, keyResultId } = req.params;

    const okr = await OKR.findById(id);

    if (!okr) {
      return res.status(404).json({ msg: "OKR no encontrado" });
    }

    const keyResult = okr.keyResults.id(keyResultId);

    if (!keyResult) {
      return res.status(404).json({ msg: "Key Result no encontrado" });
    }

    okr.keyResults.pull(keyResultId);
    await okr.save();

    await okr.populate("owner", "email personalData");

    res.status(200).json({
      msg: "Key Result eliminado con éxito",
      okr,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "ID inválido" });
    }
    res.status(500).json({
      msg: "Hubo un problema al eliminar el Key Result",
      error: error.message,
    });
  }
};

// Obtener estadísticas de OKR
const getOKRStats = async (req, res) => {
  try {
    const { ownerId, year, period } = req.query;

    const query = {};
    if (ownerId) query.owner = ownerId;
    if (year) query.year = parseInt(year);
    if (period) query.period = period;

    const okrs = await OKR.find(query);

    const stats = {
      total: okrs.length,
      byStatus: {
        draft: 0,
        active: 0,
        completed: 0,
        paused: 0,
        cancelled: 0,
      },
      averageProgress: 0,
      completed: 0,
      inProgress: 0,
    };

    let totalProgress = 0;

    okrs.forEach((okr) => {
      stats.byStatus[okr.status] = (stats.byStatus[okr.status] || 0) + 1;
      totalProgress += okr.overallProgress || 0;

      if (okr.status === "completed") {
        stats.completed++;
      } else if (okr.status === "active") {
        stats.inProgress++;
      }
    });

    stats.averageProgress =
      okrs.length > 0 ? Math.round(totalProgress / okrs.length) : 0;

    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al obtener las estadísticas",
      error: error.message,
    });
  }
};

module.exports = {
  createOKR,
  getOKRs,
  getOKRById,
  getOKRsByOwner,
  updateOKR,
  deleteOKR,
  addKeyResult,
  updateKeyResult,
  deleteKeyResult,
  getOKRStats,
};
