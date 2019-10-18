'use strict';

const Controller = require('egg').Controller;

class GeoController extends Controller {
  async save() {
    const {longitude, latitude} = this.ctx.request.body;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {appid, openid} = this.ctx.wxuser;
    // @ts-ignore
    await redis.geoadd(`${appid}:geo`, longitude, latitude, openid);
    await redis.set(`${appid}:geo_updated_at:${openid}`, Date.now());
    this.ctx.body = {
      success: true,
    };
  }
  async nearby() {
    const {distance} = this.ctx.query;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {appid, openid} = this.ctx.wxuser;
    const unit = 'km'; // m|km|ft|mi
    const d = distance > 0 ? distance : 100;
    // @ts-ignore
    const data = await redis.georadiusbymember(`${appid}:geo`, openid, d, unit, 'WITHDIST');
    this.ctx.body = {
      success: true,
      data,
    };
  }
}

module.exports = GeoController;
