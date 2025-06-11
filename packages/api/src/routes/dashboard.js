"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/:projectId', (req, res) => res.json({ projectId: req.params.projectId, widgets: [] }));
exports.default = router;
//# sourceMappingURL=dashboard.js.map