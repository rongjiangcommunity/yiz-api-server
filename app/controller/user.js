'use strict';

const Controller = require('egg').Controller;

/**
 * 个人信息
 * 认证信息：name,period,g3
 * 手机：countryCode, phoneNumber
 * 联系方式：wechat,email,mobile
 * 地区、地址：region,address [country,province,city]
 * 教育经历：education=[{what,where,when}]
 * 工作经历：experience=[{what,where,when}]
 * 感情状况：personalStatus 0,1,23 ['单身', '恋爱', '未婚', '已婚']
 * 性别：gender [male, femal]
 * 其他：wxinfo
 */
// eslint-disable-next-line max-len
const userFileds = 'countryCode,phoneNumber,wechat,personalStatus,email,mobile,region,address,country,province,city,gender,wxinfo,education,experience';

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

    // const info = await this.service.user.info(appid, openid);
    const data = Object.entries(params).filter(([k, v]) => {
      return (userFileds.indexOf(k)>=0 && v);
    }).map( ([k, v]) => {
      if (v !== null && typeof v === 'object') {
        return [k, JSON.stringify(v)];
      }
      return [k, v];
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
