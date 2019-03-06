'use strict';

const Service = require('egg').Service;

class UserService extends Service {
  /**
   * @param {{ id: string; appname: string; }} params
   */
  async info(params) {
    const [appname] = (params.id ||'').split(':');
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const user = this.ctx.user;
    const userInfo = await redis.hgetall(`${appname}:user:${user.openid}`);
    return userInfo;
  }
  /**
   * @param {ArrayLike<any>} data
   */
  async save(data) {
    const {appid, openid} = this.ctx.user;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const key = `${appid}:user:${openid}`;
    await redis.hmset(key, data);
    const result = await redis.hgetall(key);

    return result;
  }
}

module.exports = UserService;
