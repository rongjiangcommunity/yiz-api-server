/* eslint-disable max-len */
'use strict';

const Service = require('egg').Service;

class LawyerService extends Service {
  async lawyers() {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    const sql = `
      select lawyer.*,user.name,user.period,user.g3 from lawyer join user
      on lawyer.uid = user.id
      where lawyer.status=1
      limit 128;
    `;
    const data = await client.query(sql);
    if (data && data.length) {
      return data.map(camelcaseKeys);
    }
    return null;
  }
  /**
   * @param {number} id
   */
  async lawyer(id) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    const sql = `
      select lawyer.*,user.name,user.period,user.g3 from lawyer join user
      on lawyer.uid = user.id
      where lawyer.status=1 and lawyer.id=${id}
    `;
    const data = await client.query(sql);
    if (data && data.length) {
      return data.map(camelcaseKeys)[0];
    }
    return null;
  }
  /**
   * @param {number} id
   */
  async queryMsgMeta(id) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    const data = await client.get('lawyer_msg_meta', {
      id,
    });
    if (data) {
      return camelcaseKeys(data);
    }
    return null;
  }
  /**
   * @param {{fromUid: number, toUid: number}} param0
   */
  async queryPendingMsg({fromUid, toUid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `select * from lawyer_msg_meta
      where from_uid=? and to_uid=? and status in ('created', 'active')
      order by gmt_create desc
      limit 1
      `;
    const result = await client.query(sql, [fromUid, toUid]);
    return result;
  }
  /**
   * open a message
   * @param {{fromUid: number, toUid: number, msg: string}} param0
   */
  async openMsg({fromUid, toUid, msg}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const result = await client.insert('lawyer_msg_meta', {
      from_uid: fromUid,
      to_uid: toUid,
      status: 'created',
      msg,
    });
    this.ctx.logger.info('open msg', result);
    return result.affectedRows === 1;
  }

  /**
   * @param {{fromUid: number, toUid: number, msg: string, pid: number}} param0
   */
  async addMsg({fromUid, toUid, msg, pid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const result = await client.insert('lawyer_msg', {
      from_uid: fromUid,
      to_uid: toUid,
      msg,
      pid,
      read: false,
    });
    return result.affectedRows === 1;
  }
  /**
   * @param {number} id
   */
  async activeMsg(id) {
    const sql = `UPDATE lawyer_msg_meta SET status='active' where id=? AND status='created'`;
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const result = await client.query(sql, [id]);
    this.ctx.logger.info('active msg', result);
    return result.affectedRows === 1;
  }
  /**
   * @param {{id: number, finished?: boolean}} param0
   */
  async closeMsg({id, finished}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const status = finished? 'finished' : 'closed';
    const result = await client.update('lawyer_msg_meta', {
      id,
      status,
    });
    this.ctx.logger.info('open msg', result);
    return result.affectedRows === 1;
  }
  /**
   * @param {{pid: number, uid: number}} param0
   */
  async markMsgRead({pid, uid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const messages = await client.select('lawyer_msg', {
      where: {
        pid,
        to_uid: uid,
      },
      orders: [['gmt_create', 'desc']],
      limit: 10,
    });
    // this.ctx.logger.info('messages', messages);

    if (messages && messages.length) {
      const message = messages[0];
      const result = await client.update('lawyer_msg', {
        id: message.id,
        read: true,
      });
      return result.affectedRows === 1;
    }
    return false;
  }
  /**
   * @param {{offset: number, count: number, type: string, uid: number}} param0
   */
  async myConsulting({offset, count, type, uid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;

    const {msgUndoneStatusEnum, msgDoneStatusEnum} = this.ctx.helper;
    const statuses = type === 'done' ? msgDoneStatusEnum : msgUndoneStatusEnum;
    // UNIX_TIMESTAMP(a.gmt_create) as create_time
    const sql = `select a.*,
      b.name as lawyer_name,b.period as lawyer_period,b.g3 as lawyer_g3,b.phone_number as lawyer_phone,b.mobile as lawyer_mobile,b.wechat as lawyer_wechat
      from lawyer_msg_meta a
      left join user b
      on b.id=a.to_uid
      where a.from_uid = ? and a.status in ('${statuses.join('\',\'')}')
      order by gmt_create desc
      LIMIT ${offset},${count}
      `;
    const data = await client.query(sql, [uid]);
    if (data && data.length) {
      const items = await this._iterateHasUnread(data, type, uid);
      return toNestedJson(items).map(camelcaseKeys);
    }
    return null;
  }
  /**
   * @param {{offset: number, count: number, type: string, uid: number}} param0
   */
  async consultingMe({offset, count, type, uid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;

    const {msgUndoneStatusEnum, msgDoneStatusEnum} = this.ctx.helper;
    const statuses = type === 'done' ? msgDoneStatusEnum : msgUndoneStatusEnum;
    // UNIX_TIMESTAMP(a.gmt_create) as create_time
    const sql = `select a.*,
      b.name as user_name,b.period as user_period,b.g3 as user_g3,b.phone_number as user_phone,b.mobile as user_mobile,b.wechat as user_wechat
      from lawyer_msg_meta a
      left join user b
      on b.id=a.from_uid
      where a.to_uid = ? and a.status in ('${statuses.join('\',\'')}')
      order by gmt_create desc
      LIMIT ${offset},${count}
      `;
    const data = await client.query(sql, [uid]);
    if (data && data.length) {
      const items = await this._iterateHasUnread(data, type, uid);
      return toNestedJson(items).map(camelcaseKeys);
    }
    return null;
  }
  /**
   * 留言下是否有未读消息
   * @param {{pid: number, uid: number}} param0
   */
  async msgHasUnread({pid, uid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `select * from lawyer_msg where pid=? and to_uid=? order by gmt_create desc limit 0,1`;
    const data = await client.query(sql, [pid, uid]);
    if (data && data.length) {
      return data[0].read === 0;
    }
    return false;
  }
  /**
   * 是否有未读消息
   * @param {{uid: number}} param0
   */
  async hasUnread({uid}) {
    const result = await this.hasCreatedMsg({uid});
    if (result) {
      return result;
    }
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `select * from lawyer_msg where to_uid=? order by gmt_create desc limit 0,1`;
    const data = await client.query(sql, [uid]);
    if (data && data.length) {
      return data[0].read === 0;
    }
    return false;
  }
  /**
   * 律师是否有未读消息
   * @param {{uid: number}} param0
   */
  async lawyerHasUnread({uid}) {
    const result = await this.hasCreatedMsg({uid});
    if (result) {
      return result;
    }
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `
      select a.id, b.read, max(b.gmt_create) as time from lawyer_msg_meta a
      join lawyer_msg b
      on a.id=b.pid
      where a.to_uid=? and a.status ='active' and b.to_uid=?
      GROUP by a.id,b.read
      ORDER by time desc`;
    const data = await client.query(sql, [uid, uid]);

    if (data && data.length) {
      return checkHasUnread(data);
    }
    return false;
  }
  /**
   * 用户是否有未读消息
   * @param {{uid: number}} param0
   */
  async userHasUnread({uid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `
      select a.id, b.read, max(b.gmt_create) as time from lawyer_msg_meta a
      join lawyer_msg b
      on a.id=b.pid
      where a.from_uid=? and a.status ='active' and b.to_uid=?
      GROUP by a.id,b.read
      ORDER by time desc`;
    const data = await client.query(sql, [uid, uid]);
    if (data && data.length) {
      return checkHasUnread(data);
    }
    return false;
  }
  /**
   * @param {{uid: number}} param0
   */
  async hasCreatedMsg({uid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql = `select * from lawyer_msg_meta where to_uid=? and status='created' order by gmt_create desc limit 0,1`;
    const data = await client.query(sql, [uid]);
    if (data && data.length) {
      return true;
    }
    return false;
  }
  /**
   * @param {{offset: number, count: number, pid: number}} param0
   */
  async queryMsg({offset, count, pid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;

    const sql = `select * from lawyer_msg
      where pid = ?
      order by gmt_create desc
      LIMIT ${offset},${count}
      `;
    const data = await client.query(sql, [pid]);
    if (data && data.length) {
      return data.map(camelcaseKeys);
    }
    return null;
  }
  /**
   * @param {number} id
   */
  async isLawyer(id) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const data = await client.get('lawyer', {uid: id});
    return data ? true : false;
  }
  /**
   * @param {string} openid
   */
  async isLawyerByOpenid(openid) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    // eslint-disable-next-line max-len
    const sql = 'SELECT * from lawyer a INNER JOIN (SELECT * from user WHERE wechat_openid =?) b ON a.uid = b.id';
    const result = await client.query(sql, [openid]);
    return result && result.length ? true : false;
  }
  /**
   * @param {number[]} ids
   */
  async queryUserInfo(ids) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    const sql = `select id,name,period,g3,phone_number,mobile,wechat from user where id in(${ids.join(',')})`;
    const data = await client.query(sql);
    if (data && data.length) {
      return data.map(camelcaseKeys);
    }
    return [];
  }
  /**
   * @param {{offset: number, count: number, hours: number}} param0
   */
  async queryDelay({hours, offset, count}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    const status = 'created';
    const delay = hours*60*60;

    const sql = `
      select a.*,
      b.id as lawyer_id,b.name as lawyer_name,b.period as lawyer_period,b.g3 as lawyer_g3,b.phone_number as lawyer_phone,b.mobile as lawyer_mobile,b.wechat as lawyer_wechat,
      c.id as user_id,c.name as user_name,c.period as user_period,c.g3 as user_g3,c.phone_number as user_phone,c.mobile as user_mobile,c.wechat as user_wechat
      from lawyer_msg_meta a
      left join user b on a.to_uid=b.id
      left join user c on a.from_uid=c.id
      where a.status='${status}' and (UNIX_TIMESTAMP(a.gmt_create)+${delay})<UNIX_TIMESTAMP(CURRENT_TIMESTAMP)
      order by gmt_create desc
      LIMIT ${offset},${count}
      `;
    const data = await client.query(sql);
    if (data && data.length) {
      return toNestedJson(data).map(camelcaseKeys);
    }
    return [];
  }
  async stat() {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const sql =`
      SELECT to_uid, b.name, b.period, b.g3, status, COUNT(*) as cnt
      from lawyer_msg_meta a
      JOIN yiz.user b
      on a.to_uid=b.id
      GROUP BY to_uid,status
      order by to_uid
      `;
    return await client.query(sql);
  }
  /**
   * @param {object[]} items
   * @param {string} type
   * @param {number} uid
   */
  async _iterateHasUnread(items, type, uid) {
    if (type === 'done') {
      /**
       * @param {any} item
       */
      return items.map(item => ({
        ...item,
        hasUnread: false,
      }));
    }
    return await Promise.all(items.map(async item => {
      const hasUnread = await this.msgHasUnread({pid: item.id, uid});
      return {
        ...item,
        hasUnread,
      };
    }));
  }
}
module.exports = LawyerService;


/**
 * @param {{ [s: string]: any; }[]} data
 */
function toNestedJson(data) {
  if (!data || !data.length) {
    return [];
  }
  const re = /(user|lawyer)_(\w+)/;
  /**
   * @param {{ [s: string]: any; }} item
   */
  function fn(item) {
    return Object.entries(item).reduce((pre, [key, value])=>{
      const ms = key.match(re);
      if (ms) {
        pre[ms[1]] = pre[ms[1]] || {};
        pre[ms[1]][ms[2]] = value;
      } else {
        pre[key] = value;
      }
      return pre;
    }, /** @type {{[s: string]: any;}} */({}));
  }
  return data.map(fn);
}

/**
 * @param {{id:number,time:string,read: 0|1}[]} list
 */
function checkHasUnread(list) {
  /** @type {{[key: string]: boolean}} */
  const hasRead = {};
  for (let i=0; i<list.length; i++) {
    const item = list[i];
    if (!hasRead[`${item.id}`]) {
      if (item.read === 0) {
        return true;
      } else {
        hasRead[`${item.id}`] = true;
      }
    }
  }
  return false;
}
