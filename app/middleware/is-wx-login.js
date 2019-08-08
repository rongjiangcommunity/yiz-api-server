'use strict';

module.exports = () => {
  // @ts-ignore
  return async (ctx, next) => {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(ctx.app.redis.get('redis'));
    const {sid} = ctx.params;
    const [appid, sessionId] = (sid ||'').split(':');
    const wxinfo = await redis.hgetall(`${appid}:credentials:${sessionId}`);
    if (!wxinfo || !wxinfo.openid) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        data: 'Forbidden',
        status: 403,
      };
      return;
    }
    ctx.wxuser = {...wxinfo, appid};

    const {openid} = wxinfo;
    const {formId} = ctx.request.body;

    if (formId && openid) {
      ctx.helper.saveFormId(appid, openid, formId);
    }
    await next();
  };
};
