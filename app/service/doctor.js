/* eslint-disable max-len */
'use strict';

const Service = require('egg').Service;
// const mysql = require('mysql');

class DoctorService extends Service {
  async doctors() {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const columns = ['hospital', 'speciality', 'id', 'title', 'detail', 'department', 'avatar', 'name', 'status', 'create_time'];
    // const sql = `select ${columns.join(',')} from ?? limit ?`;
    // const data = await client.query(sql, ['doctor', 100]);

    const data = await client.select('doctor', {
      limit: 100,
      columns,
    });
    return data;
  }
  /**
   * @param {{[key:string]: any}} row
   */
  async book(row) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const data = await client.insert('doctor_booking', row);
    return data && data.affectedRows === 1;
  }
  /**
   * @param {{start?: number, end?: number, openid: string}} params
   */
  async myBookings(params) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    // TODO: query with start, end @jiewei.ljw
    const {openid} = params;
    const sql = `
      SELECT a.id,a.create_time,a.update_time,a.drid as dr_id,a.uid,a.reg_date,a.note,a.fb_note,a.fb_uid,a.status,
      b.avatar as dr_avatar,b.department as dr_department,b.detail as dr_detail,b.hospital as dr_hospital,b.name as dr_name,b.status as dr_status,b.title as dr_title
      FROM doctor_booking as a LEFT JOIN doctor as b
      ON drid = b.id
      WHERE a.uid = '${openid}'
      ORDER by create_time DESC
      LIMIT 100
    `;
    return await client.query(sql);
  }
  /**
   * @param {{openid: string, bid: number}} params
   */
  async myBooking(params) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const {bid, openid} = params;

    const sql = `
      SELECT a.id,a.create_time,a.update_time,a.drid as dr_id,a.uid,a.reg_date,a.note,a.fb_note,a.fb_uid,a.status,
      b.avatar as dr_avatar,b.department as dr_department,b.detail as dr_detail,b.hospital as dr_hospital,b.name as dr_name,b.status as dr_status,b.title as dr_title
      FROM doctor_booking as a
      LEFT JOIN doctor as b
      ON drid = b.id
      WHERE a.id = ${bid}
      AND a.uid = '${openid}'
    `;
    return (await client.query(sql) || [])[0];
  }
  /**
   * @param {{openid: string, bid: number, action: string, note?: string}} params
   */
  async updateMyBooking(params) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const {openid, bid, action, note} = params;
    let setString = 'status = \'wait\'';
    if (note) {
      setString = `${setString},note='${note}'`;
    }
    const cancelSql = `
      UPDATE doctor_booking SET status = 'cancel'
      WHERE id = ${bid}
      AND uid = '${openid}'
      AND status = 'wait'
    `;
    const rebookSql = `
      UPDATE doctor_booking SET ${setString}
      WHERE id = ${bid}
      AND uid = '${openid}'
      AND status in ('failed', 'cancel')
    `;
    const sql = action === 'rebook' ? rebookSql :
      action === 'cancel' ? cancelSql : '';

    if (sql) {
      const result = await client.query(sql);
      return result && result.affectedRows === 1;
    }
    return false;
  }
  async countUndone() {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const status = '\'wait\', \'active\'';
    const sql = `
      SELECT COUNT(*) as cnt FROM doctor_booking WHERE status in (${status})
    `;
    return ((await client.query(sql) || [])[0] || {}).cnt;
  }
  /**
   * @param {{bid: number}} params
   */
  async queryBooking(params) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const {bid} = params;
    const sql = `
      SELECT a.id,a.create_time,a.update_time,a.drid as dr_id,a.uid,a.reg_date,a.note,a.fb_note,a.fb_uid,a.status,
      b.avatar as dr_avatar,b.department as dr_department,b.detail as dr_detail,b.hospital as dr_hospital,b.name as dr_name,b.status as dr_status,b.title as dr_title,b.mobile as dr_mobile
      FROM doctor_booking as a
      LEFT JOIN doctor as b
      ON drid = b.id
      WHERE a.id = ${bid}
    `;
    return (await client.query(sql) || [])[0];
  }
  /**
   * @param {{start:number, end:number, status?: string}} params
   */
  async queryBookings(params) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    let {start, end, status} = params;
    const conditions = [];

    if (status) {
      const statuses = status.split(',');
      if (statuses.length > 1) {
        conditions.push(`a.status in ('${statuses.join('\',\'')}')`);
      } else {
        conditions.push(`a.status = '${status}'`);
      }
    }
    if (start > 0) {
      start = start/1000;
      conditions.push(`UNIX_TIMESTAMP(a.create_time) >= ${start}`);
    }
    if (end > 0) {
      end = end/1000;
      conditions.push(`UNIX_TIMESTAMP(a.create_time) <= ${end}`);
    }

    const sql = `
      SELECT a.id,a.create_time,a.update_time,a.drid as dr_id,a.uid,a.reg_date,a.note,a.fb_note,a.fb_uid,a.status,
      b.avatar as dr_avatar,b.department as dr_department,b.detail as dr_detail,b.hospital as dr_hospital,b.name as dr_name,b.status as dr_status,b.title as dr_title,b.mobile as dr_mobile
      FROM doctor_booking as a
      LEFT JOIN doctor as b
      ON drid = b.id
      ${conditions.length? 'WHERE ' +conditions.join(' AND '): ''}
      limit 32
    `;
    return await client.query(sql);
  }
  /**
   *
   * @param {{fbNote: string, fbUid: string, status: string, bid: number}} params
   */
  async updateBooking(params) {
    // @ts-ignore
    const client = await (this.app.mysql.get('yiz'));
    const {fbNote, fbUid, status, bid} = params;

    const result = await client.update('doctor_booking', {
      fb_note: fbNote,
      fb_uid: fbUid,
      status,
      id: bid,
    });

    return result.affectedRows === 1;
  }
}

module.exports = DoctorService;
