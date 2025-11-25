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
  addProgressRecord,
  updateProgressRecord,
  deleteProgressRecord,
  getOKRStats,
} = require("../controllers/okr.controllers");

const routerOKR = express.Router();

// Rutas principales de OKR
routerOKR.post("/createOKR", createOKR);
routerOKR.get("/getOKRs", getOKRs);
routerOKR.get("/getOKRStats", getOKRStats);
routerOKR.get("/getOKRById/:id", getOKRById);
routerOKR.get("/getOKRsByOwner/:ownerId", getOKRsByOwner);
routerOKR.put("/updateOKR/:id", updateOKR);
routerOKR.delete("/deleteOKR/:id", deleteOKR);

// Rutas para Key Results
routerOKR.post("/addKeyResult/:id", addKeyResult);
routerOKR.put("/updateKeyResult/:id/:keyResultId", updateKeyResult);
routerOKR.delete("/deleteKeyResult/:id/:keyResultId", deleteKeyResult);

// Rutas para registros de avance (Progress Records)
routerOKR.post("/addProgressRecord/:id/:keyResultId", addProgressRecord);
routerOKR.put(
  "/updateProgressRecord/:id/:keyResultId/:recordId",
  updateProgressRecord
);
routerOKR.delete(
  "/deleteProgressRecord/:id/:keyResultId/:recordId",
  deleteProgressRecord
);

module.exports = routerOKR;
