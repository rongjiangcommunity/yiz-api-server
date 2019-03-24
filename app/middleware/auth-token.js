'use strict';

module.exports = () => {
  // @ts-ignore
  return async (ctx, next) => {
    const token = ctx.headers['X-Auth-Token'] || ctx.headers['x-auth-token'];
    ctx.logger.info('x-auth-token', token);
    if (token !== ctx.app.config['authtoken']) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        data: 'Forbidden',
        status: 403,
      };
      return;
    }
    await next();
  };
};
