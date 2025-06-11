"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/ping', (req, res) => res.json({ status: 'auth ok' }));
exports.default = router;
//# sourceMappingURL=auth.js.map