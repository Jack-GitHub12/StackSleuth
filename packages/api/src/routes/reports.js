"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/', (req, res) => res.status(202).json({ reportId: 'rep_1' }));
router.get('/:reportId', (req, res) => res.json({ status: 'processing' }));
exports.default = router;
//# sourceMappingURL=reports.js.map