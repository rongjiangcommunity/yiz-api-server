'use strict';

const Service = require('egg').Service;

class RegisterService extends Service {
  /**
   * @param {string} appid
   * @param {string} openid
   * @param {{name: string; period: number; g3: number; wechat: string; mobile: string; classmates: string;}} info
   */
  async applyFor(appid, openid, info) {
    const {PENDING} = this.ctx.helper;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {name, period, g3, wechat, mobile, classmates} = info;

    const key = `${appid}:apply:${openid}`;
    const now = Date.now();
    /** @type {[string, any][]} */
    const data = [];

    if (!(await redis.exists(key))) {
      data.push(['gmt_create', now]);
    }

    data.push(['name', name]);
    data.push(['period', period]);
    data.push(['g3', g3]);
    data.push(['wechat', wechat]);
    data.push(['mobile', mobile]);
    data.push(['classmates', classmates]);

    data.push(['status', PENDING]);
    data.push(['assign_to', '']);
    data.push(['approved_by', '']);
    data.push(['approved_by_name', '']); // 88-10-ljw
    data.push(['comment', '']); // 审批人意见
    data.push(['gmt_modified', now]);

    const applySetKey = `${appid}:apply_list:${period}-${g3}`;
    const allApplySetKey = `${appid}:apply_list:admin`;
    // @TODO redis.multi
    await redis.hmset(key, new Map(data));
    // @ts-ignore
    await redis.zadd(applySetKey, now, openid);
    // @ts-ignore
    await redis.zadd(allApplySetKey, now, openid);
    const result = await redis.hgetall(key);
    return result;
  }
  /**
   * @param {{appid:string, openid: string}} params
   */
  async applyInfo(params) {
    const {appid, openid} = params;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const key = `${appid}:apply:${openid}`;
    const data = await redis.hgetall(key);
    return data;
  }

  /**
   * @param {{appid: string, openid: string, start: number, stop: number, type?:string}} params
   */
  async reviewList(params) {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {start, stop, openid, appid, type} = params;

    const reviewer = await redis.hgetall(`${appid}:user:${openid}`);
    const {CADMIN, ADMIN} = this.ctx.helper;
    let key = '';
    let typekey = 'apply_list';
    if (type === 'reviewed') {
      typekey = 'reviewed_list';
    }
    if (reviewer.role === ADMIN) {
      key = `${appid}:${typekey}:admin`;
    } else if (reviewer.role === CADMIN) {
      if (reviewer.g3 && reviewer.period) {
        key = `${appid}:${typekey}:${reviewer.period}-${reviewer.g3}`;
      }
    }
    if (key) {
      /** @type string[] */
      const ids = await redis.zrange(key, start, stop);
      const list = await Promise.all(ids.map(id => {
        return redis.hgetall(`${appid}:apply:${id}`);
      }));
      return list.map((item, index) => {
        return {...item, uid: ids[index]};
      });
    }
    return null;
  }

  /**
   * @param {string} appid
   * @param {string} openid
   * @param {{ comment: string; approved: boolean; uid: string; }} params
   */
  async review(appid, openid, params) {
    const {OK, NOT_OK} = this.ctx.helper;
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const now = Date.now();
    // uid,openid
    const {comment, approved, uid} = params;
    /** @type {[string, any][]} */
    const data = [];

    const reviewer = await redis.hgetall(`${appid}:user:${openid}`);
    const reviewerName = reviewer ? `${reviewer.period}-${reviewer.g3} ${reviewer.name}` : '';

    const uidKey = `${appid}:user:${uid}`;
    const applyKey = `${appid}:apply:${uid}`;
    const status = approved ? OK : NOT_OK;
    data.push(['status', status]);
    data.push(['comment', comment]); // 审批人意见
    data.push(['gmt_modified', now]);

    data.push(['approved_by', openid]); // 88-10-ljw
    data.push(['approved_by_name', reviewerName]);

    // @TODO redis.multi
    await redis.hmset(applyKey, new Map(data));
    await redis.hset(uidKey, 'approved', approved);

    const {period, g3} = await redis.hgetall(applyKey);

    const applySetKey = `${appid}:apply_list:${period}-${g3}`;
    const allApplySetKey = `${appid}:apply_list:admin`;
    const reviewedKey = `${appid}:reviewed_list:${period}-${g3}`;
    const allReviewedKey = `${appid}:reviewed_list:admin`;

    await redis.zrem(applySetKey, uid);
    await redis.zrem(allApplySetKey, uid);
    // @ts-ignore
    await redis.zadd(reviewedKey, now, uid);
    // @ts-ignore
    await redis.zadd(allReviewedKey, now, uid);
    return true;
  }
}

module.exports = RegisterService;
