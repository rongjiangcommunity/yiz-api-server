'use strict';

const Service = require('egg').Service;

class LawyerService extends Service {
  // TODO: rm below insert api
  async insert() {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    await client.insert('lawyer', {
      uid: 1,
      status: 1,
    });
  }
  async lawyers() {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const camelcaseKeys = this.ctx.helper.camelcaseKeys;
    const data = await client.select('lawyer', {
      limit: 100,
    });
    if (data && data.length) {
      return data.map(camelcaseKeys);
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
    this.ctx.logger.info('messages', messages);

    if (messages) {
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
   * @param {{offset: number, count: number, type: string, uid: number, consultingMe: boolean}} param0
   */
  async consultings({offset, count, type, uid, consultingMe}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));

    const {msgUndoneStatusEnum, msgDoneStatusEnum} = this.ctx.helper;
    const statuses = type === 'done' ? msgDoneStatusEnum : msgUndoneStatusEnum;
    const uidKey = consultingMe ? 'to_uid' : 'from_uid';

    const sql = `select * from lawyer_msg_meta
      where ${uidKey} = ? and status in ('${statuses.join('\',\'')}')
      order by gmt_create desc
      LIMIT ${offset},${count}
      `;
    const data = await client.query(sql, [uid]);
    return data;
  }

  /**
   * @param {{offset: number, count: number, pid: number}} param0
   */
  async queryMsg({offset, count, pid}) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));

    const sql = `select * from lawyer_msg
      where pid = ?
      order by gmt_create desc
      LIMIT ${offset},${count}
      `;
    const data = await client.query(sql, [pid]);
    return data;
  }
  /**
   * @param {number} id
   */
  async isLawyer(id) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const data = await client.get('lawyer', {uid: id});
    this.logger.info('data', data);
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
    return result ? true : false;
  }
}

module.exports = LawyerService;
