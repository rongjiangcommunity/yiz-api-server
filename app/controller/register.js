'use strict';

const Controller = require('egg').Controller;

class RegisterController extends Controller {
  /**
   * POST /api/user/apply/:sid
   * curl -X POST 127.0.0.1:7001/api/user/apply/yiz:$sid  -H 'Content-Type: application/json' -d '{"name":"ljw", "period":88, "g3": 10, "wechat": "wx123", "mobile": "123", "classmates":"c1,c2,c3", "message": "hello"}'
   */
  async applyFor() {
    const {appid, openid} = this.ctx.wxuser;
    // eslint-disable-next-line max-len
    const {name, period, g3, wechat, mobile, classmates, message, g2, g1, gender} = this.ctx.request.body;
    if ( !isPositive(period) || !isPositive(g3)) {
      this.ctx.body = {
        success: false,
        msg: 'invalid params',
      };
      return;
    }
    // const userinfo = await this.service.user.query(appid, openid);
    // if (userinfo.approved === 'true') {
    //   this.ctx.body = {
    //     success: false,
    //     msg: 'You are already a xiaoyou.',
    //   };
    //   return;
    // }
    const result = await this.service.register.applyFor(appid, openid, {
      name, period, g3, wechat, mobile, classmates, message, g2, g1, gender,
    });

    this.ctx.body = {
      success: !!result,
    };
  }
  /**
   * GET /api/user/apply/:sid
   * curl 127.0.0.1:7001/api/user/apply/yiz:$sid
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
   * GET /api/user/reviewcount/:sid
   * curl 127.0.0.1:7001/api/user/reviewcount/yiz:$sid
   */
  async reviewCount() {
    const {appid, openid} = this.ctx.wxuser;
    const data = await this.service.register.reviewCount({openid, appid});
    this.ctx.body = {
      success: true,
      data,
    };
  }
  /**
   * GET /api/user/reviewlist/:sid
   * curl 127.0.0.1:7001/api/user/reviewlist/yiz:$sid
   */
  async reviewList() {
    const {appid, openid} = this.ctx.wxuser;
    let {start, stop} = this.ctx.query;
    start = start || 0;
    stop = stop || 64;

    const data = await this.service.register.reviewList({start, stop, openid, appid});
    this.ctx.body = {
      success: !!data,
      data,
    };
  }
  /**
   * GET /api/user/reviewhistory/:sid
   * curl 127.0.0.1:7001/api/user/reviewhistory/yiz:$sid
   */
  async reviewHistory() {
    const {appid, openid} = this.ctx.wxuser;
    let {start, stop} = this.ctx.query;
    start = start || 0;
    stop = stop || -1;
    const data = await this.service.register.reviewHistory({start, stop, openid, appid});
    this.ctx.body = {
      success: !!data,
      data,
    };
  }
  /**
   * GET /api/user/review/:sid/:uid
   * curl 127.0.0.1:7001/api/user/review/yiz:$sid/o-YIv5TyMkOjeXljbwY6CqScAdq4
   */
  async reviewInfo() {
    this.ctx.body = {
      success: true,
      data: this.ctx.applyInfo,
    };
  }
  /**
   * POST /api/user/review/:sid/:uid
   * curl -X POST 127.0.0.1:7001/api/user/review/yiz:$sid/o-YIv5TyMkOjeXljbwY6CqScAdq4 -H 'Content-Type: application/json' -d '{"comment":"优秀", "approved":true}'
   */
  async review() {
    const {appid, openid} = this.ctx.wxuser;
    const {uid} = this.ctx.params;
    const {comment, approved} = this.ctx.request.body;
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
