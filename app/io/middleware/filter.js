'use strict';

module.exports = () => {
  // @ts-ignore
  return async (ctx, next) => {
    ctx.logger.warn('packet', ctx.packet);

    const hello = await ctx.service.ws.hello();
    ctx.socket.emit('res', 'packet=' + hello);
    await next();
    ctx.logger.warn('packet', 'response done!');
  };
};
