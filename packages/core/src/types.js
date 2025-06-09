"use strict";
/**
 * Core types for StackSleuth performance tracing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceStatus = exports.SpanType = void 0;
var SpanType;
(function (SpanType) {
    SpanType["HTTP_REQUEST"] = "http_request";
    SpanType["DB_QUERY"] = "db_query";
    SpanType["REACT_RENDER"] = "react_render";
    SpanType["FUNCTION_CALL"] = "function_call";
    SpanType["CUSTOM"] = "custom";
})(SpanType || (exports.SpanType = SpanType = {}));
var TraceStatus;
(function (TraceStatus) {
    TraceStatus["PENDING"] = "pending";
    TraceStatus["SUCCESS"] = "success";
    TraceStatus["ERROR"] = "error";
    TraceStatus["TIMEOUT"] = "timeout";
})(TraceStatus || (exports.TraceStatus = TraceStatus = {}));
//# sourceMappingURL=types.js.map