'use strict';

module.exports = () => {
  // @ts-ignore
  return async (ctx, next) => {
    const {CADMIN} = ctx.helper;
    const {appid} = ctx.wxuser;
    const {uid} = ctx.params;
    const {g3, period, role} = ctx.user;
    const applyInfo = await ctx.service.register.applyInfo({appid, openid: uid});

    if (!applyInfo || !applyInfo.g3 || !applyInfo.period) {
      ctx.body = {
        success: false,
        msg: 'apply info null',
      };
      return;
    }
    if (role === CADMIN) {
      const u1 = {g3: Number(g3), period: Number(period)};
      const u2 = {
        g3: Number(applyInfo.g3),
        period: Number(applyInfo.period),
      };
      if (!isClassmate(u1, u2)) {
        ctx.body = {
          success: false,
          msg: 'not classmate',
        };
        return;
      }
    }
    ctx.applyInfo = applyInfo;
    await next();
  };
};
/**
 * @param {{ g3: number; period: number; }} u1
 * @param {{ g3: number; period: number; }} u2
 */
function isClassmate(u1, u2) {
  if (u1.g3 && u1.period && u2.g3 && u2.period) {
    return u1.g3 === u2.g3 && u1.period === u2.period;
  }
  return false;
}
