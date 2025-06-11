"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/', (req, res) => res.json({ ok: true }));
router.get('/:traceId', (req, res) => res.json({ traceId: req.params.traceId, spans: [] }));
exports.default = router;
//# sourceMappingURL=traces.js.map