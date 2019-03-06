'use strict';

const Controller = require('egg').Controller;

// gender: 0=男 1=女
// period 届
const requiredFileds = 'name,gender,mobile,period,g3,country,province,city,email,wechat';
const otherFileds = 'g2,g1,degree,university,residence,hobby,work';

class UserController extends Controller {
  async info() {
    const {id} = this.ctx.params;
    const {appname} = this.ctx.query;
    const info = await this.service.user.info({id, appname});
    this.ctx.body = {
      data: info,
      success: true,
    };
  }
  async save() {
    const params = this.ctx.request.body;
    const data = Object.entries(params).filter(([k, v]) => {
      return (requiredFileds.indexOf(k)>=0 && v) || otherFileds.indexOf(k) >=0;
    });
    this.logger.info('data', data);
    const result = await this.service.user.save(new Map(data));
    this.ctx.body = {
      data: result,
      success: true,
    };
  }
}

module.exports = UserController;
