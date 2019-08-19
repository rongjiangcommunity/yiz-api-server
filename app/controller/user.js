'use strict';

const Controller = require('egg').Controller;

/**
 * 个人信息
 * 认证信息：name,period,g3
 * 联系方式：countryCode, phoneNumber, wechat,email,mobile
 * origin 籍贯，workingArea 工作区域，livingArea 生活区
 * isPhd 是否博士，selfEmployed 是否自主创业
 * 教育经历：education=[{what,where,when,major}]
 * 工作经历：experience=[{what,where,when}]
 * 感情状况：personalStatus 0,1,2 ['单身', '恋爱中', '已婚']
 * 性别：gender [male, femal]
 * country,province,city
 * region 地区, address 地址
 * 其他：wxinfo
 */
const userFileds = [
  'countryCode', 'phoneNumber',
  'wechat', 'email', 'mobile',
  'gender', 'personalStatus',
  // https://www.yuque.com/oqh30u/topics/32
  'origin', 'workingArea', 'livingArea', 'isPhd', 'selfEmployed',
  'education', 'experience',
  // 'country', 'province', 'city',
  // 'region', 'address',
  // 'wxinfo',
];

class UserController extends Controller {
  /**
   * GET /api/user/:sid
   * curl 127.0.0.1:7001/api/user/yiz:$sid
   */
  async info() {
    const {appid, openid} = this.ctx.wxuser;
    const info = await this.service.user.query({appid, openid});
    this.ctx.body = {
      data: info,
      success: true,
    };
  }
  /**
   * POST /api/user/:sid
   * curl -X POST 127.0.0.1:7001/api/user/yiz:$sid  -H 'Content-Type: application/json' -d '{"name":"ljw", "gender":"male"}'
   */
  async update() {
    const {appid, openid} = this.ctx.wxuser;
    const params = this.ctx.request.body;
    if (params.wxinfo) {
      await this.service.user.saveWxinfo({wxinfo: params.wxinfo, appid, openid});
    }

    const data = Object.entries(params).filter(([k, v]) => {
      return (userFileds.indexOf(k)>=0 && v);
    }).map( ([k, v]) => {
      if (v !== null && typeof v === 'object') {
        return [k, JSON.stringify(v)];
      }
      return [k, v];
    });
    const row = data.reduce((pre, [k, v]) => {
      // @ts-ignore
      pre[k] = v;
      return pre;
    }, {});
    // this.logger.info('row', row);
    const result = await this.service.user.update({openid, row});
    this.ctx.body = {
      success: result,
    };
  }
  /**
   * POST /api/user/feedback/:sid
   * curl -X POST 127.0.0.1:7001/api/user/feedback/yiz:$sid  -H 'Content-Type: application/json' -d '{"message":"awesome app"}'
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
