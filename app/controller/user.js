'use strict';

const Controller = require('egg').Controller;

// period 届
const requiredFileds = 'name,gender,mobile,period,g3,country,province,city,email,wechat';
const otherFileds = 'g2,g1,degree,university,residence,hobby,work';
const limitFileds = ['period', 'g3', 'name'];

class UserController extends Controller {
  /**
   * GET /api/user/:sid
   * curl 127.0.0.1:7001/api/user/yiz:3e466730e285c1da19f0c40011ef45a3d57b8f292ffd17f48faf32895aa1a28d
   */
  async info() {
    const {appid, openid} = this.ctx.wxuser;
    const info = await this.service.user.info(appid, openid);
    this.ctx.body = {
      data: info,
      success: true,
    };
  }
  /**
   * POST /api/user/:sid
   * curl -X POST 127.0.0.1:7001/api/user/yiz:3e466730e285c1da19f0c40011ef45a3d57b8f292ffd17f48faf32895aa1a28d  -H 'Content-Type: application/json' -d '{"name":"ljw", "gender":"male"}'
   */
  async save() {
    const {appid, openid} = this.ctx.wxuser;
    const params = this.ctx.request.body;

    const info = await this.service.user.info(appid, openid);
    let approved = false;
    if (info && info.approved === 'true') {
      approved = true;
    }
    const data = Object.entries(params).filter(([k, v]) => {
      // 已认证校友限制修改
      if (approved && limitFileds.indexOf(k) >= 0) {
        return false;
      }
      return (requiredFileds.indexOf(k)>=0 && v) || otherFileds.indexOf(k) >=0;
    });
    // this.logger.info('data', data);
    const result = await this.service.user.save(appid, openid, data);
    this.ctx.body = {
      data: result,
      success: true,
    };
  }
  /**
   * POST /api/user/feedback/:sid
   * curl -X POST 127.0.0.1:7001/api/user/feedback/yiz:3e466730e285c1da19f0c40011ef45a3d57b8f292ffd17f48faf32895aa1a28d  -H 'Content-Type: application/json' -d '{"message":"awesome app"}'
   */
  async feedback() {
    const {appid, openid} = this.ctx.wxuser;
    const {message} = this.ctx.request.body;
    const result = await this.service.user.feedback(appid, openid, message);

    this.ctx.body = {
      success: result,
    };
  }
}

module.exports = UserController;
