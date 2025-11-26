const { Schema, model } = require("mongoose");

// Schema para los registros de avance de un Key Result
const progressRecordSchema = Schema(
  {
    advanceUnits: { type: Number, required: true }, // Unidades de avance
    advanceDate: { type: Date, required: true, default: Date.now }, // Fecha de avance
    comment: { type: String, required: false, default: "" }, // Comentario asociado
  },
  { _id: true, timestamps: true }
);

const keyResultSchema = Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    currentValue: { type: Number, default: 0 },
    targetValue: { type: Number, required: true },
    unit: { type: String, required: false, default: "" }, // %, cantidad, etc.
    progress: { type: Number, default: 0, min: 0, max: 100 }, // Porcentaje de progreso
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "at_risk"],
      default: "not_started",
    },
    completedAt: { type: Date, required: false },
    // Matriz de registros de avance
    progressRecords: [progressRecordSchema],
    // Responsables del Key Result (puede tener uno o varios)
    responsibles: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { _id: true }
);

const okrSchema = Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },

    // Relación con el usuario propietario
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Período del OKR
    period: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4", "annual", "custom"],
      required: true,
    },
    year: { type: Number, required: true },

    // Fechas
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Resultados clave
    keyResults: [keyResultSchema],

    // Progreso general del OKR (calculado o manual)
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Estado del OKR
    status: {
      type: String,
      enum: ["draft", "active", "completed", "paused", "cancelled"],
      default: "draft",
    },

    // Fecha de completación
    completedAt: { type: Date, required: false },

    // Categoría o área del OKR (opcional)
    category: { type: String, required: false },

    // Tags para organización
    tags: [{ type: String }],

    // Notas adicionales
    notes: { type: String, required: false },

    // Equipo o departamento (opcional)
    team: { type: String, required: false },

    // Visibilidad
    visibility: {
      type: String,
      enum: ["private", "team", "public"],
      default: "private",
    },
  },
  {
    timestamps: true, // Crea createdAt y updatedAt automáticamente
  }
);

// Método para calcular el progreso general basado en los Key Results
okrSchema.methods.calculateOverallProgress = function () {
  if (!this.keyResults || this.keyResults.length === 0) {
    this.overallProgress = 0;
    return 0;
  }

  const totalProgress = this.keyResults.reduce(
    (sum, kr) => sum + (kr.progress || 0),
    0
  );
  this.overallProgress = Math.round(totalProgress / this.keyResults.length);
  return this.overallProgress;
};

// Método para actualizar el estado basado en fechas y progreso
okrSchema.methods.updateStatus = function () {
  const now = new Date();

  if (this.status === "cancelled") {
    return; // No cambiar si está cancelado
  }

  if (this.overallProgress >= 100) {
    this.status = "completed";
    if (!this.completedAt) {
      this.completedAt = now;
    }
  } else if (now > this.endDate && this.status === "active") {
    // Si pasó la fecha de fin pero no está completado
    this.status = "completed"; // O podrías usar "overdue"
  } else if (
    now >= this.startDate &&
    now <= this.endDate &&
    this.status === "draft"
  ) {
    this.status = "active";
  }
};

// Pre-save hook para calcular progreso y actualizar estado
okrSchema.pre("save", function (next) {
  this.calculateOverallProgress();
  this.updateStatus();
  next();
});

module.exports = model("OKR", okrSchema);
