'use strict';

module.exports = () => {
  return async (ctx, next) => {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(ctx.app.redis.get('redis'));
    const {id} = ctx.params;
    const [appid, sessionId] = (id ||'').split(':');

    const user = await redis.hgetall(`${appid}:credentials:${sessionId}`);

    ctx.user = {...user, appid};
    ctx.logger.info('user', ctx.user);

    if (!user || !user.openid) {
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
