/* eslint-disable max-len */
'use strict';

const Controller = require('egg').Controller;

class DoctorController extends Controller {
  /**
   * GET /api/doctor/doctors/:sid
   * curl 127.0.0.1:7001/api/doctor/doctors/yiz:$sid
   */
  async doctors() {
    const data = await this.service.doctor.doctors();
    this.ctx.body = {
      data,
      success: true,
    };
  }
  /**
   * POST /api/doctor/booking/:sid
   * curl -X POST 127.0.0.1:7001/api/doctor/booking/yiz:$sid -H 'Content-Type: application/json' -d '{"regDate":"2019-06-24", "note":"挂号看病", "drid": 1}'
   */
  async book() {
    const {openid} = this.ctx.wxuser;
    const {drid, regDate, note} = this.ctx.request.body;
    // status: wait, active, completed, failed, cancel
    const status = 'wait';

    if (!regDate || !note) {
      this.ctx.body = {
        msg: 'invalid params',
        success: false,
      };
      return;
    }
    const rows = await this.service.doctor.queryBeforeBook({
      uid: openid,
      drid,
      reg_date: `${regDate}`.trim(),
    });
    if (rows && rows.length) {
      this.ctx.body = {
        success: false,
        mes: '同一天一个医生只能预约一次',
      };
      return;
    }
    const data = await this.service.doctor.book({
      uid: openid,
      drid,
      status,
      reg_date: `${regDate}`.trim(),
      note,
    });
    this.ctx.body = {
      success: data,
    };
  }
  /**
   * GET /api/doctor/booking/:sid/:bid
   * curl 127.0.0.1:7001/api/doctor/booking/yiz:$sid/1
   */
  async mybooking() {
    const {openid} = this.ctx.wxuser;
    const {bid} = this.ctx.params;
    const data = await this.service.doctor.myBooking({
      openid, bid,
    });
    this.ctx.body = {
      data,
      success: true,
    };
  }
  /**
   * GET /api/doctor/booking/:sid
   * curl 127.0.0.1:7001/api/doctor/booking/yiz:$sid
   */
  async mybookings() {
    const {openid} = this.ctx.wxuser;
    let {start, end} = this.ctx.query;

    if (end < start) {
      [start, end] = [end, start];
    }
    const data = await this.service.doctor.myBookings({
      start, end, openid,
    });
    this.ctx.body = {
      data,
      success: true,
    };
  }
  /**
   * POST /api/doctor/booking/rebook/:sid/:bid
   * curl -X POST 127.0.0.1:7001/api/doctor/booking/rebook/yiz:$sid/1
   */
  async rebook() {
    const {openid} = this.ctx.wxuser;
    const {bid} = this.ctx.params;
    const {note, regDate} = this.ctx.request.body;

    const data = await this.service.doctor.updateMyBooking({
      openid, bid, action: 'rebook', note, regDate: `${regDate}`.trim(),
    });
    this.ctx.body = {
      success: data,
    };
  }
  /**
   * POST /api/doctor/booking/cancel/:sid/:bid
   * curl -X POST 127.0.0.1:7001/api/doctor/booking/cancel/yiz:$sid/1
   */
  async cancel() {
    const {openid} = this.ctx.wxuser;
    const {bid} = this.ctx.params;

    const data = await this.service.doctor.updateMyBooking({
      openid, bid, action: 'cancel',
    });
    this.ctx.body = {
      success: data,
    };
  }

  /**
   * GET /api/doctor/admin/booking/count/undone/:sid
   * curl 127.0.0.1:7001/api/doctor/admin/booking/count/undone/:sid
   */
  async countUndone() {
    // const {appid} = this.ctx.wxuser;
    const data = await this.service.doctor.countUndone();
    this.ctx.body = {
      success: true,
      data,
    };
  }

  /**
   * GET /api/doctor/admin/booking/:sid/:bid
   * curl 127.0.0.1:7001/api/doctor/admin/booking/yiz:$sid/2
   */
  async querybooking() {
    const {appid} = this.ctx.wxuser;
    const {bid} = this.ctx.params;
    const data = await this.service.doctor.queryBooking({
      bid,
    });
    if (data && data.uid) {
      const info = await this.service.user.query(appid, data.uid);
      if (info) {
        data.user = {
          uid: data.uid,
          ...getUserinfo(info),
        };
      }
    }
    this.ctx.body = {
      data,
      success: true,
    };
  }
  /**
   * GET /api/doctor/admin/booking/:sid
   * curl 127.0.0.1:7001/api/doctor/admin/booking/yiz:$sid?status=wait&start=1561376343000&end=1561389673000
   *
   * query 参数
   * start: 时间戳，可选
   * end: 时间戳，可选
   * status: wait, active, completed, failed, cancel，可选
   */
  async querybookings() {
    const {appid} = this.ctx.wxuser;
    let {status, start, end}= this.ctx.query;
    if (end < start) {
      [start, end] = [end, start];
    }
    const data = await this.service.doctor.queryBookings({
      status, start, end,
    });
    if (data && data.length) {
      // @ts-ignore
      const ids = data.map(d => d.uid);
      const users = await this.service.user.batchQuery(appid, ids);
      // @ts-ignore
      const map = users.reduce((pre, cur) => {
        pre[cur.id] = cur;
        return pre;
      }, {});
      // @ts-ignore
      data.forEach(d => {
        const info = d && map[d.uid];
        if (info) {
          d.user = {
            uid: d.uid,
            ...getUserinfo(info),
          };
        }
      });
    }
    this.ctx.body = {
      data,
      success: true,
    };
  }
  /**
   * POST /api/doctor/admin/booking/:sid/:bid
   * curl -X POST 127.0.0.1:7001/api/doctor/admin/booking/yiz:$sid/1 -H 'Content-Type: application/json' -d '{"fbNote":"好的，马上处理", "status":"active"}'
   */
  async updatebooking() {
    const bookingStatusEnum = this.ctx.helper.bookingStatusEnum;
    const {openid} = this.ctx.wxuser;
    const {bid} = this.ctx.params;
    const {fbNote, status} = this.ctx.request.body;
    if (bookingStatusEnum.indexOf(status) < 0) {
      this.ctx.body = {
        msg: 'invalid status params',
        success: false,
      };
      return;
    }
    const data = await this.service.doctor.updateBooking({
      fbNote, fbUid: openid, status, bid,
    });
    this.ctx.body = {
      success: data,
    };
  }
}

/**
 * @param {{ g3: any; period: any; name: any; phoneNumber: any; wechat: any; approved: any; }} info
 */
function getUserinfo(info) {
  if (!info) {
    return null;
  }
  return {
    g3: info.g3,
    period: info.period,
    name: info.name,
    phoneNumber: info.phoneNumber,
    wechat: info.wechat,
    approved: info.approved,
  };
}

module.exports = DoctorController;
