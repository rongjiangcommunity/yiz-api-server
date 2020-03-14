'use strict';

module.exports = () => {
  // @ts-ignore
  return async (ctx, next) => {
    ctx.logger.warn('connection', 'connected!');
    const status = await ctx.service.ws.status();
    ctx.socket.emit('res', 'auth=' + status);
    await next();
    ctx.logger.warn('connection', 'disconnected!');
  };
};
