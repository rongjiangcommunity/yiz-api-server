'use strict';

const Controller = require('egg').Controller;

class RegisterController extends Controller {
  /**
   * POST /api/user/apply/:sid
   * curl -X POST 127.0.0.1:7001/api/user/apply/yiz:3e466730e285c1da19f0c40011ef45a3d57b8f292ffd17f48faf32895aa1a28d  -H 'Content-Type: application/json' -d '{"name":"ljw", "period":88, "g3": 10, "wechat": "wx123", "mobile": "123", "classmates":"c1,c2,c3"}'
   */
  async applyFor() {
    const {appid, openid} = this.ctx.wxuser;
    const {name, period, g3, wechat, mobile, classmates} = this.ctx.request.body;
    if ( !isPositive(period) || !isPositive(g3)) {
      this.ctx.body = {
        success: false,
        msg: 'invalid params',
      };
      return;
    }
    const userinfo = await this.service.user.info(appid, openid);
    if (userinfo.approved === 'true') {
      this.ctx.body = {
        success: false,
        msg: 'You are already a xiaoyou.',
      };
      return;
    }
    await this.service.register.applyFor(appid, openid, {
      name, period, g3, wechat, mobile, classmates,
    });

    this.ctx.body = {
      success: true,
      // data,
    };
  }
  /**
   * GET /api/user/apply/:sid
   * curl 127.0.0.1:7001/api/user/apply/yiz:3e466730e285c1da19f0c40011ef45a3d57b8f292ffd17f48faf32895aa1a28d
   */
  async applyInfo() {
    const {appid, openid} = this.ctx.wxuser;
    const data = await this.service.register.applyInfo({appid, openid});
    this.ctx.body = {
      success: !!(data && data.g3 && data.period),
      data,
    };
  }

  /**
   * GET /api/user/reviewlist/:sid
   * curl 127.0.0.1:7001/api/user/reviewlist/yiz:3e466730e285c1da19f0c40011ef45a3d57b8f292ffd17f48faf32895aa1a28d
   */
  async reviewList() {
    const {type} = this.ctx.query;
    const {appid, openid} = this.ctx.wxuser;
    const data = await this.service.register.reviewList({start: 0, stop: -1, openid, appid, type});
    this.ctx.body = {
      success: !!data,
      data,
    };
  }
  /**
   * GET /api/user/review/:sid/:uid
   * curl 127.0.0.1:7001/api/user/review/yiz:3e466730e285c1da19f0c40011ef45a3d57b8f292ffd17f48faf32895aa1a28d/o-YIv5TyMkOjeXljbwY6CqScAdq4
   */
  async reviewInfo() {
    this.ctx.body = {
      success: true,
      data: this.ctx.applyInfo,
    };
  }
  /**
   * POST /api/user/review/:sid/:uid
   * curl -X POST 127.0.0.1:7001/api/user/review/yiz:3e466730e285c1da19f0c40011ef45a3d57b8f292ffd17f48faf32895aa1a28d/o-YIv5TyMkOjeXljbwY6CqScAdq4
   */
  async review() {
    const {appid, openid} = this.ctx.wxuser;
    const {comment, approved, uid} = this.ctx.request.body;
    const result = await this.service.register.review(appid, openid, {
      comment,
      approved,
      uid,
    });
    this.ctx.body = {
      success: result,
    };
  }
}

/**
 * @param {number} n
 */
function isPositive(n) {
  return typeof n === 'number' && n > 0;
}

module.exports = RegisterController;
