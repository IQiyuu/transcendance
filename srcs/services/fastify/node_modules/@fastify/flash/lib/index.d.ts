import { flashFactory } from './flash';
declare module 'fastify' {
    interface FastifyRequest {
        flash: ReturnType<typeof flashFactory>['request'];
    }
    interface FastifyReply {
        flash: ReturnType<typeof flashFactory>['reply'];
    }
}
declare const _default: import("fastify").FastifyPluginCallback<{}, import("fastify").RawServerDefault, import("fastify").FastifyTypeProviderDefault, import("fastify").FastifyBaseLogger>;
export = _default;
