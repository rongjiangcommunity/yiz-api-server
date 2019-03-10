'use strict';

const Controller = require('egg').Controller;

class WechatController extends Controller {
  async redeem() {
    const {appid, code} = this.ctx.request.body;
    if (!appid || !code) {
      this.ctx.status = 403;
      this.ctx.body = {
        success: false,
      };
      return;
    }
    this.ctx.body = await this.service.wechat.redeem(this.ctx.request.body);
  }
  async expire() {
    const {credentials} = this.ctx.request.body;
    if (!credentials) {
      this.ctx.status = 404;
      this.ctx.body = {
        success: false,
      };
      return;
    }
    await this.service.wechat.expire(this.ctx.request.body);
    this.ctx.body = {
      success: true,
      data: credentials,
    };
  }
}

module.exports = WechatController;
