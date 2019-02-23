'use strict';

const Service = require('egg').Service;
const crypto = require('crypto');
const secret = '93sa37i4pTFWA2l6gun/AA';

class WechatService extends Service {
  /**
   * @param {{app: string, code: string}} params
   */
  async redeem(params) {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));

    const appConf = this.app.config.wechat.appConf || {};
    const urlPrefix = this.app.config.wechat.jscode2session;
    let credentials = '';

    const {app, code} = params;

    if (!appConf[app]) {
      this.ctx.status = 404;
      return;
    }

    const config = appConf[app];
    // eslint-disable-next-line
    const querys = `appid=${config.appid}&secret=${config.secret}&js_code=${code}&grant_type=authorization_cod`;

    const result = await this.ctx.curl(`${urlPrefix}?${querys}`, {dataType: 'json'});

    this.logger.info('jscode result', result);

    if (result && result.status === 200) {
      const data = result.data;
      if (data && data.openid && data.session_key) {
        credentials = crypto.createHmac('sha256', secret)
          .update(`${data.openid}|${data.session_key}`)
          .digest('hex');

        // del expired session
        const c = await redis.get(`${app}:session:${data.openid}`);
        if (c) {
          await redis.del(`${app}:credentials:${c}`);
        }
        // store openid
        await redis.hmset(`${app}:credentials:${credentials}`, {
          openid: data.openid,
          session_key: data.session_key,
          unionid: data.unionid || '',
        });

        await redis.set(`${app}:session:${data.openid}`, credentials);
        this.logger.info('jscode credentials', credentials);
      }
    }

    if (credentials) {
      this.ctx.body = {
        credentials,
        success: true,
      };
      return;
    }
    this.ctx.body = {
      success: false,
      data: result.data,
    };
    return;
  }
  /**
   * @param {{app: string, credentials: string}} params
   */
  async expire(params) {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {credentials, app} = params;
    await redis.del(`${app}:credentials:${credentials}`);
    this.ctx.body = {
      success: true,
      data: credentials,
    };
  }


  async changeApprove(params) {
    const redis = this.app.redis.get('redis');
    const {credentials, app, approved} = params;
    const userInfo = await redis.hgetall(`${app}:credentials${credentials}`);

    if (userInfo && userInfo.openid) {
      await redis.hmset(`${app}:user:${userInfo.openid}`, {
        approved: !!approved,
      });
    }

    // @TODO
  }
  async isApproved(params) {
    const redis = this.app.redis.get('redis');
    const {credentials, app} = params;
    const userInfo = await redis.hgetall(`${app}:credentials${credentials}`);

    if (userInfo && userInfo.openid) {
      return await redis.hget(`${app}:user:${userInfo.openid}`, 'approved');
    }
    return false;
  }
}

module.exports = WechatService;
