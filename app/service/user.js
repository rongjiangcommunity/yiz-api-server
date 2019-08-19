'use strict';

const Service = require('egg').Service;
const camelcase = require('camelcase');
const decamelize = require('decamelize');

class UserService extends Service {
  /**
   * query user info
   * @param {{openid: string, appid?: string}} param
   */
  async query({openid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const [user] = await client.select('user', {
      where: {
        wechat_openid: openid,
      },
    });
    if (user) {
      return tranformKeys(user, camelcase);
    }
    return null;
  }
  /**
   * @param {{openids:string[],appid?:string}} param
   */
  async batchQuery({openids}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `select * from user where wechat_openid in('${openids.join('\',\'')}')`;
    const users = await client.query(sql);

    if (users && users.length) {
      return users.map(camelcaseKeys);
    }
    return null;
  }
  /**
   * @param {{row:object, appid?:string, openid: string}} param
   */
  async save({row, openid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const keys = Object.keys(row).map(key => decamelize(key));
    const values = Object.values(row).map(v => {
      if (typeof v === 'boolean') {
        return String(v);
      }
      return v;
    });
    if (!keys.find(k => k==='wechat_openid')) {
      keys.push('wechat_openid');
      values.push(openid);
    }

    const updates = keys.map((key, index) => {
      return `${key}=${client.escape(values[index])}`;
    });
    // eslint-disable-next-line max-len
    const sql = `INSERT INTO user (${keys.join(',')}) VALUES(?) ON DUPLICATE KEY UPDATE ${updates.join(',')}`;
    // this.logger.info('sql', sql, values);
    const data = await client.query(sql, [values]);
    return data && data.affectedRows === 1;
  }
  /**
   * @param {{row:object, appid?:string, openid: string}} param
   */
  async update({row, openid}) {
    if (Object.keys(row).length===0) {
      return 1;
    }
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const newRow = boolStringValues(tranformKeys(row, decamelize));
    const data = await client.update('user', newRow, {
      where: {
        wechat_openid: openid,
      },
    });
    return data && data.affectedRows === 1;
  }
  /**
   * @param {{appid: string, openid: string,wxinfo: any}} param0
   */
  async saveWxinfo({appid, openid, wxinfo}) {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    if (!wxinfo) {
      return;
    }
    const s = typeof wxinfo === 'object' ? JSON.stringify(wxinfo) : wxinfo;
    await redis.set(`${appid}:wxinfo:${openid}`, s);
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

/**
 * @param {{[key: string]: any}} o
 */
function camelcaseKeys(o) {
  return tranformKeys(o, camelcase);
}
/**
 * @param {{[key: string]: any}} o
 * @param {function} fn
 */
function tranformKeys(o, fn) {
  const u = {};
  Object.keys(o).forEach(key => {
    // @ts-ignore
    u[fn(key)] = o[key];
  });
  return u;
}
/**
 * @param {{[key: string]: any}} o
 */
function boolStringValues(o) {
  const u = {};
  Object.keys(o).forEach(key => {
    if (typeof o[key] === 'boolean') {
      // @ts-ignore
      u[key] = String(o[key]);
    } else {
      // @ts-ignore
      u[key] = o[key];
    }
  });
  return u;
}
