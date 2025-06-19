"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const flash_1 = require("./flash");
module.exports = (0, fastify_plugin_1.default)(function (fastify, _opts, done) {
    const flash = (0, flash_1.flashFactory)();
    fastify.decorateRequest('flash', flash.request);
    fastify.decorateReply('flash', flash.reply);
    done();
}, {
    fastify: '5.x',
    name: '@fastify/flash',
    decorators: {
        request: ['session'],
    },
});
