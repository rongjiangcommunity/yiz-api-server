'use strict';

/**
 * @param {string} role
 */
module.exports = (role) => {
  // @ts-ignore
  return async (ctx, next) => {
    ctx.logger.info('middleware', 'check-role');
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(ctx.app.redis.get('redis'));
    const roles = ctx.helper.roles;
    const {sid} = ctx.params;
    const [appid, sessionId] = (sid ||'').split(':');
    const {openid} = await redis.hgetall(`${appid}:credentials:${sessionId}`);

    if (!openid) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        data: 'Forbidden',
        status: 403,
      };
      return;
    }
    const user = await redis.hgetall(`${appid}:user:${openid}`);

    if (roles.indexOf(user.role) < roles.indexOf(role)) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        data: 'Permission denied',
        status: 403,
      };
      return;
    }
    ctx.user = {...user, appid, openid};
    // ctx.logger.info('user', user);
    await next();
  };
};
