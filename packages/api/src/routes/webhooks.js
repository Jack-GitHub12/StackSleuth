"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/', (req, res) => res.json({ ok: true }));
exports.default = router;
//# sourceMappingURL=webhooks.js.map