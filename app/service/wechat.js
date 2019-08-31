/* eslint-disable camelcase */
'use strict';

const Service = require('egg').Service;
const crypto = require('crypto');
const secret = '93sa37i4pTFWA2l6gun/AA';
const defaultExSeconds = 24*60*60;

class WechatService extends Service {
  /**
   * @param {{appid: string, code: string}} params
   */
  async redeem(params) {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));

    const appConf = this.app.config.wechat.appConf || {};
    const urlPrefix = this.app.config.wechat.jscode2session;
    const {appid, code} = params;
    const exSeconds = appConf.sessionExSeconds || defaultExSeconds;

    if (!appConf[appid]) {
      return {
        success: false,
        data: 'invalid appid',
      };
    }
    const config = appConf[appid];
    let sha256hash = '';
    // eslint-disable-next-line
    const querys = `appid=${config.appid}&secret=${config.secret}&js_code=${code}&grant_type=authorization_cod`;
    const result = await this.ctx.curl(`${urlPrefix}?${querys}`, {dataType: 'json'});

    // this.logger.info('jscode result', result);

    if (result && result.status === 200) {
      const data = result.data;
      if (data && data.openid && data.session_key) {
        sha256hash = crypto.createHmac('sha256', secret)
          .update(`${data.openid}|${data.session_key}`)
          .digest('hex');

        // del expired session
        const c = await redis.get(`${appid}:session:${data.openid}`);
        if (c) {
          await redis.del(`${appid}:credentials:${c}`);
        }
        const pipe = redis.pipeline();
        pipe.hmset(`${appid}:credentials:${sha256hash}`, {
          openid: data.openid,
          session_key: data.session_key,
          unionid: data.unionid || '',
        });
        pipe.expire(`${appid}:credentials:${sha256hash}`, exSeconds);
        pipe.set(`${appid}:session:${data.openid}`, sha256hash, 'EX', exSeconds);
        await pipe.exec();
        this.logger.info('jscode credentials', sha256hash);
      }
    }

    return sha256hash ? {
      success: true,
      data: `${appid}:${sha256hash}`,
    } : {
      success: false,
      data: 'wx error',
    };
  }
  /**
   * @param {{appid: string, credentials: string}} params
   */
  async expire(params) {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {credentials} = params;

    const [appid, session] = credentials.split(',');
    await redis.del(`${appid}:credentials:${session}`);
    return true;
  }
  /**
   * @param {{appid:string}} params
   */
  async accessToken(params) {
    const appConf = this.app.config.wechat.appConf || {};
    const {appid} = params;

    if (!appConf[appid]) {
      return {
        success: false,
        data: 'invalid appid',
      };
    }
    const config = appConf[appid];
    const server = `https://api.weixin.qq.com/cgi-bin/token`;
    const querys = `grant_type=client_credential&appid=${config.appid}&secret=${config.secret}`;

    const result = await this.ctx.curl(`${server}?${querys}`, {dataType: 'json'});
    return result && result.data || '';
  }
}

module.exports = WechatService;
