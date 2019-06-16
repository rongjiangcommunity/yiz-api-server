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
  async decrypt() {
    const WXBizDataCrypt = require('../lib/wx-decrypt');
    const {session_key: sessionKey} = this.ctx.wxuser;

    const {encryptedData, iv, appId} = this.ctx.request.body;
    const pc = new WXBizDataCrypt(appId, sessionKey);

    const data = pc.decryptData(encryptedData, iv);
    this.ctx.body = {
      success: true,
      data,
    };
  }
}

module.exports = WechatController;
