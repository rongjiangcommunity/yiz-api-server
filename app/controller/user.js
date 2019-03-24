'use strict';

const Controller = require('egg').Controller;

// period 届
const requiredFileds = 'name,gender,mobile,period,g3,country,province,city,email,wechat';
const otherFileds = 'g2,g1,degree,university,residence,hobby,work';

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
    const data = Object.entries(params).filter(([k, v]) => {
      return (requiredFileds.indexOf(k)>=0 && v) || otherFileds.indexOf(k) >=0;
    });
    this.logger.info('data', data);
    const result = await this.service.user.save(appid, openid, data);
    this.ctx.body = {
      data: result,
      success: true,
    };
  }
}

module.exports = UserController;
