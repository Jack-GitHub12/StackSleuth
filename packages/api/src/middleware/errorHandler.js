"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
function notFoundHandler(req, res) {
    res.status(404).json({ error: 'Not Found' });
}
function errorHandler(err, req, res, next) {
    logger_1.logger.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
//# sourceMappingURL=errorHandler.js.map