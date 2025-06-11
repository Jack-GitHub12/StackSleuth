"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/', (req, res) => res.json({ received: true }));
router.get('/', (req, res) => res.json({ metrics: [] }));
exports.default = router;
//# sourceMappingURL=metrics.js.map