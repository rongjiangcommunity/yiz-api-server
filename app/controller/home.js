'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    this.ctx.body = 'Hi, how are you?';
  }
  async phgetall() {
    const {pattern} = this.ctx.params;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    // @ts-ignore
    this.ctx.body = await redis.phgetall(0, pattern);
  }
  async pget() {
    const {pattern} = this.ctx.params;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    // @ts-ignore
    this.ctx.body = await redis.pget(0, pattern);
  }
  async lrange() {
    const {pattern} = this.ctx.params;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    // @ts-ignore
    this.ctx.body = await redis.lrange(pattern, 0, -1);
  }
  async zrange() {
    const {pattern} = this.ctx.params;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    // @ts-ignore
    this.ctx.body = await redis.zrange(pattern, 0, -1);
  }
}

module.exports = HomeController;
