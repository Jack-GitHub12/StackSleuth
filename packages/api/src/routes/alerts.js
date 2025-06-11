"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (req, res) => res.json([]));
router.post('/', (req, res) => res.status(201).json({ id: 'alert_1' }));
exports.default = router;
//# sourceMappingURL=alerts.js.map