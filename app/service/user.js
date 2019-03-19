'use strict';

const Service = require('egg').Service;

class UserService extends Service {
  async info() {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {appid, openid} = this.ctx.user;
    const userInfo = await redis.hgetall(`${appid}:user:${openid}`);
    return userInfo;
  }
  /**
   * @param {[string, any][]} data
   */
  async save(data) {
    const {appid, openid} = this.ctx.user;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const key = `${appid}:user:${openid}`;
    const now = Date.now();
    /** @type {[string, any][]} */
    const extra = [];
    if (!(await redis.exists(key))) {
      extra.push(['gmt_create', now]);
      extra.push(['approved', false]);
      extra.push(['role', '']);
    }
    extra.push(['gmt_modified', now]);

    await redis.hmset(key, new Map(data.concat(extra)));
    const result = await redis.hgetall(key);

    return result;
  }
}
module.exports = UserService;

