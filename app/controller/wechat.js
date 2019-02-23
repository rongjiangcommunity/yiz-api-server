'use strict';

const Controller = require('egg').Controller;

class WechatController extends Controller {
  async redeem() {
    const {app, code} = this.ctx.request.body;
    if (!app || !code) {
      this.ctx.status = 403;
      this.ctx.body = {
        success: false,
      };
      return;
    }
    await this.service.wechat.redeem(this.ctx.request.body);
  }
  async expire() {
    const {credentials, app} = this.ctx.request.body;
    if (!credentials || !app) {
      this.ctx.status = 404;
      this.ctx.body = {
        success: false,
      };
      return;
    }
    await this.service.wechat.expire(this.ctx.request.body);
  }
}

module.exports = WechatController;
