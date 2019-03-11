'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    this.ctx.body = 'hi, wechat auth';
  }
  async hgetallp() {
    const {pattern} = this.ctx.params;
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    this.ctx.body = await redis.hgetallp(0, pattern);
  }
  async getp() {
    const {pattern} = this.ctx.params;
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    this.ctx.body = await redis.getp(0, pattern);
  }
}

module.exports = HomeController;
