'use strict';

const Service = require('egg').Service;
const decamelize = require('decamelize');

class MagpieService extends Service {
  /**
   * @param {{row:object, appid?:string, openid: string}} param
   */
  async create({row, openid}) {
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
    const sql = `INSERT INTO magpie_user (${keys.join(',')}) VALUES(?) ON DUPLICATE KEY UPDATE ${updates.join(',')}`;
    const data = await client.query(sql, [values]);
    return data && data.affectedRows === 1 ? true : false;
  }
  /**
   * @param {{row:object, appid?:string, openid: string}} param
   */
  async update({row, openid}) {
    const tranformKeys = this.ctx.helper.tranformKeys;
    if (Object.keys(row).length===0) {
      return false;
    }
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const newRow = boolStringValues(tranformKeys(row, decamelize));
    const data = await client.update('magpie_user', newRow, {
      where: {
        wechat_openid: openid,
      },
    });
    return data && data.affectedRows === 1 ? true : false;
  }
  /**
   * @param {{openid: string,feeling:number}} param0
   */
  async myHeartbeat({openid, feeling}) {
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const items = await client.select('magpie_heartbeat', {
      where: {
        from_wxid: openid,
        feeling,
      },
    });
    if (items && items.length > 0) {
      // @ts-ignore
      const ids = items.map(item => item.to_wxid);
      const users = await this.queryUserInfo(ids);
      // @ts-ignore
      const map = users.reduce((pre, u) => {
        pre[u.wechatOpenid] = u;
        return pre;
      }, {});
      // @ts-ignore
      return items.map(item => {
        return {
          user: map[item.to_wxid],
          ...item,
        };
      }).map(camelcaseKeys);
    }
    return null;
  }
  /**
   * @param {{openid: string}} param1
   */
  async recomend({openid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    const info = await this.query({openid});
    if (!info) {
      return null;
    }
    const hearts = await client.select('magpie_heartbeat', {
      where: {
        from_wxid: openid,
      },
    });
    const sql = `select * from magpie_user where
      wechat_openid!='${openid}' and gender!='${info.gender}'`;
    /** @type {string[]} */
    const dislikes = hearts && hearts.length ?
      // @ts-ignore
      hearts.filter(h => h.feeling !==1).map(h => h.to_wxid) : [];
    /**
     * @param {string} id
     */
    const isDislike = (id) => dislikes.indexOf(id) >= 0;

    const data = await client.query(sql);
    if (data && data.length) {
      // @ts-ignore
      return data.filter((item) => !isDislike(item.wechat_openid))
        .map(camelcaseKeys);
    }
    return null;
  }
  /**
   * @param {string[]} ids
   */
  async queryUserInfo(ids) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    const sql = `select * from magpie_user where wechat_openid in('${ids.join('\',\'')}')`;
    const data = await client.query(sql);
    if (data && data.length) {
      return data.map(camelcaseKeys);
    }
    return [];
  }
  /**
   * query info
   * @param {{openid: string, appid?: string}} param
   */
  async query({openid}) {
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const [user] = await client.select('magpie_user', {
      where: {
        wechat_openid: openid,
      },
    });
    if (user) {
      return camelcaseKeys(user);
    }
    return null;
  }
  /**
   * @param {{status: string[], offset: number, count: number}} param0
   */
  async queryByStatus({status, offset, count}) {
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `select * from magpie_user
      where status in('${status.join('\',\'')}')
      order by gmt_create desc
      LIMIT ${offset},${count}
    `;
    const result = await client.query(sql);
    if (result && result.length) {
      return result.map(camelcaseKeys);
    }
    return null;
  }
  /**
   * @param {{reviewBy: string,status: string, openid: string}} param0
   */
  async review({reviewBy, status, openid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const data = await client.update('magpie_user', {
      status,
      review_by: reviewBy,
    }, {
      where: {
        wechat_openid: openid,
      },
    });
    return data && data.affectedRows === 1 ? true : false;
  }
  /**
   * @param {{from: string,to: string, feeling: number}} row
   */
  async heartbeat(row) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const keys = Object.keys(row).map(key => decamelize(key));
    const values = Object.values(row);

    const updates = keys.map((key, index) => {
      return `${key}=${client.escape(values[index])}`;
    });
    const sql = `INSERT INTO magpie_heartbeat (${keys.join(',')}) VALUES(?)
      ON DUPLICATE KEY UPDATE ${updates.join(',')}`;
    const data = await client.query(sql, [values]);
    return data && data.affectedRows >= 1 ? true : false;
  }
  async oneAnother() {
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `SELECT h1.* from
      yiz.magpie_heartbeat h1 INNER JOIN yiz.magpie_heartbeat h2
      on h1.from_wxid = h2.to_wxid and h1.to_wxid = h2.from_wxid and h1.feeling=1 and h2.feeling=1
      and h1.gmt_create < h2.gmt_create`;
    const items = await client.query(sql);
    if (items && items.length) {
      return items.map(camelcaseKeys);
    }
    return null;
  }
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

module.exports = MagpieService;
