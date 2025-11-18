const express = require("express");
const {
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
} = require("../controllers/okr.controllers");

const routerOKR = express.Router();

// Rutas principales de OKR
routerOKR.post("/", createOKR);
routerOKR.get("/", getOKRs);
routerOKR.get("/stats", getOKRStats);
routerOKR.get("/:id", getOKRById);
routerOKR.get("/owner/:ownerId", getOKRsByOwner);
routerOKR.put("/:id", updateOKR);
routerOKR.delete("/:id", deleteOKR);

// Rutas para Key Results
routerOKR.post("/:id/key-results", addKeyResult);
routerOKR.put("/:id/key-results/:keyResultId", updateKeyResult);
routerOKR.delete("/:id/key-results/:keyResultId", deleteKeyResult);

module.exports = routerOKR;
