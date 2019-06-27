'use strict';

const Service = require('egg').Service;

class UserService extends Service {
  /**
   * @param {string} appid
   * @param {string} openid
   */
  async query(appid, openid) {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    return await redis.hgetall(`${appid}:user:${openid}`);
  }
  /**
   * @param {[string, any][]} data
   * @param {string} appid
   * @param {string} openid
   */
  async save(appid, openid, data) {
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
    return await redis.hgetall(key);
  }
  /**
   * @param {string} appid
   * @param {string} openid
   * @param {string} message
   */
  async feedback(appid, openid, message) {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const now = Date.now();
    const key = `${appid}:feedbacks`;
    const data = {
      gmt_create: now,
      uid: openid,
      message,
    };
    const result = await redis.lpush(key, JSON.stringify(data));
    return result > 0;
  }
}
module.exports = UserService;

