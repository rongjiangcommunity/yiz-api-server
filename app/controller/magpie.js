'use strict';

const Controller = require('egg').Controller;
const camelcase = require('camelcase');

const type2Sqlcolumn = {
  album: 'album',
  tag: 'tags',
};
const types = Object.keys(type2Sqlcolumn);

const columns = [
  'name', 'wechat', 'mobile', 'birth', 'period', 'g3',
  'gender', 'cm', 'single_status',
  'degree', 'major', 'college',
  'working_area', 'school_status', 'work_for', 'yearly_income',
  'id_img_front', 'id_img_back',
  'manifesto', 'tags', 'album',
];
const moreColumns = ['country_code', 'phone_number', 'email', 'living_area'];
const allColumns = columns.concat(moreColumns);

const reviewStatus = ['created', 'ok', 'notok', 'disabled'];

class MagpieController extends Controller {
  /**
   * 添加个人相片/标签
   * curl '127.0.0.1:7001/api/magpie/zadd/:sid' -H 'content-type: application/json' --data-binary '{"values":["cloud://rongjiang-t2mpj.726f-rongjiang-t2mpj-1259623375/magpie/aRvKKxuYnRXZd4204e7e977fd79af1c2b68f1fdff5dd.jpg","cloud://rongjiang-t2mpj.726f-rongjiang-t2mpj-1259623375/magpie/rPBeiMPwJSoXd56d39a7f2120b3f5797706762a303e4.jpg"],"type":"album"}'
   */
  async zadd() {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {appid, openid} = this.ctx.wxuser;
    let {type, values} = this.ctx.request.body;

    if (types.indexOf(type) < 0) {
      this.ctx.status = 400;
      this.ctx.body = {
        success: false,
      };
      return;
    }
    if (!Array.isArray(values)) {
      values = [values];
    }
    const key = `${appid}:magpie_${type}:${openid}`;
    const pipe = await redis.multi();

    // @ts-ignore
    values.forEach(v => {
      pipe.zadd(key, String(Date.now()), v);
    });
    const result = await pipe.exec().then(() => {
      return true;
    // @ts-ignore
    }).catch(e => {
      this.logger.error(e);
      return false;
    });

    const items = await redis.zrange(key, 0, -1);
    if (items && items.length) {
      const row = {
        // @ts-ignore
        [type2Sqlcolumn[type]]: items.join(','),
      };
      await this.service.magpie.update({
        row, openid,
      });
    }
    this.ctx.body = {
      success: result,
      data: items,
    };
  }
  /**
   * 获取个人相片/标签 集
   * curl '127.0.0.1:7001/api/magpie/zrange/:sid?type=album' -H 'content-type: application/json'
   */
  async zrange() {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {appid, openid} = this.ctx.wxuser;
    let {type, start, stop} = this.ctx.query;
    start = start >= 0 ? start:0;
    stop = stop > start ? stop : -1;
    if (types.indexOf(type) < 0) {
      this.ctx.status = 400;
      this.ctx.body = {
        success: false,
      };
      return;
    }
    const key = `${appid}:magpie_${type}:${openid}`;
    const ids = await redis.zrange(key, start, stop);
    this.ctx.body = {
      success: true,
      data: ids,
    };
  }
  /**
   * 删除个人相片/标签
   * curl '127.0.0.1:7001/api/magpie/zrem/:sid' -H 'content-type: application/json' --data-binary '{"value":"cloud://rongjiang-t2mpj.726f-rongjiang-t2mpj-1259623375/magpie/aRvKKxuYnRXZd4204e7e977fd79af1c2b68f1fdff5dd.jpg","type":"album"}'
   */
  async zrem() {
    // @ts-ignore
    const redis = /** @type {MyTypes.Redis} */(this.app.redis.get('redis'));
    const {appid, openid} = this.ctx.wxuser;
    const {type, value} = this.ctx.request.body;

    const key = `${appid}:magpie_${type}:${openid}`;
    const result= await redis.zrem(key, value);

    const items = await redis.zrange(key, 0, -1);
    if (items && items.length) {
      const row = {
        // @ts-ignore
        [type2Sqlcolumn[type]]: items.join(','),
      };
      await this.service.magpie.update({
        row, openid,
      });
    }

    this.ctx.body = {
      success: result === 1,
    };
  }
  /**
   * 发起鹊桥注册
   * curl 127.0.0.1:7001/api/magpie/register/:sid -H 'content-type: application/json'  -d '{"name":"女测试","wechat":"wx_test","mobile":"13535348821","birth":"2000-1-1","period":"96","g3":"9","degree":"本 科","major":"测试自动化","college":"广东大学","working_area":"广州天河","school_status":"工作","work_for":"自由职业","yearly_income":"10w","manifesto":"你主动点我们就有故事","tags":"仙女,二次元,诗人","album":""}'
   */
  async register() {
    const {openid} = this.ctx.wxuser;
    const body = this.ctx.request.body;

    const columns = allColumns.map(v => camelcase(v));
    const data = Object.entries(body).filter(([key, value]) => {
      return columns.indexOf(key) >= 0 && !!value;
    });
    const params = data.reduce((pre, [k, v]) => {
      // @ts-ignore
      pre[k] = v;
      return pre;
    }, {});
    if (!Object.keys(params).length) {
      this.ctx.body = {
        success: true,
      };
      return;
    }
    const row = {
      // statuses: created/ok/notok/disabled
      status: 'created',
      wechatOpenid: openid,
      ...params,
    };
    const result = await this.ctx.service.magpie.create({row, openid});
    this.ctx.body = {
      success: result,
    };
  }
  /**
   * 更新个人鹊桥信息
   * curl 127.0.0.1:7001/api/magpie/info/:sid -H 'content-type: application/json'  -d '{"wechat":"wx_test1"}'
   */
  async update() {
    const {openid} = this.ctx.wxuser;
    const body = this.ctx.request.body;

    const columns = allColumns.map(v => camelcase(v));
    const data = Object.entries(body).filter(([key]) => {
      return columns.indexOf(key) >= 0;
    });
    const row = data.reduce((pre, [k, v]) => {
      // @ts-ignore
      pre[k] = v;
      return pre;
    }, {});
    if (!Object.keys(row).length) {
      this.ctx.body = {
        success: true,
      };
      return;
    }
    const result = await this.ctx.service.magpie.update({row, openid});
    this.ctx.body = {
      success: result,
    };
  }
  /**
   * curl 127.0.0.1:7001/api/magpie/info/:sid
   */
  async query() {
    const {openid} = this.ctx.wxuser;
    const result = await this.ctx.service.magpie.query({openid});
    this.ctx.body = {
      success: true,
      data: result,
    };
  }
  /**
   * curl -X POST 127.0.0.1:7001/api/magpie/[dislike|like]/:openid/:sid
   */
  async heartbeat() {
    const {openid: fromId} = this.ctx.wxuser;
    const {openid: toId, action} = this.ctx.params;
    const actions = ['dislike', 'like'];
    const isActionValid = actions.indexOf(action) >= 0;

    // TODO: check openid is a valid user

    if (!isActionValid) {
      this.ctx.body = {
        success: false,
      };
      return;
    }
    const result = await this.ctx.service.magpie.heartbeat({
      feeling: actions.indexOf(action),
      from_wxid: fromId,
      to_wxid: toId,
    });
    this.ctx.body = {
      success: result,
    };
  }
  async myHeartbeat() {
    const {openid} = this.ctx.wxuser;
    const result = await this.ctx.service.magpie.myHeartbeat({
      feeling: 1,
      openid,
    });
    this.ctx.body = {
      success: true,
      data: result,
    };
  }


  /**
   * curl 127.0.0.1:7001/api/magpie/admin/query/:sid?openid=${openid}
   */
  async queryByOpenid() {
    const {openid} = this.ctx.query;
    const result = await this.ctx.service.magpie.query({openid});
    this.ctx.body = {
      success: true,
      data: result,
    };
  }
  /**
   *  curl 127.0.0.1:7001/api/magpie/admin/users/:sid?status=created,ok
   */
  async queryByStatus() {
    const {status} = this.ctx.query;
    let {offset, count} = this.ctx.query;
    offset = offset >= 0 ? offset:0;
    count = count > 0?count : 16;

    if (!status) {
      this.ctx.body = {
        success: false,
      };
      return;
    }
    // @ts-ignore
    const validStatus = status.split(',').filter(s=> reviewStatus.indexOf(s) >= 0);
    if (!validStatus.length) {
      this.ctx.body = {
        success: false,
      };
      return;
    }
    const result = await this.ctx.service.magpie.queryByStatus({
      status: validStatus, offset, count,
    });
    this.ctx.body = {
      success: true,
      data: result,
    };
  }
  /**
   * curl -X POST  127.0.0.1:7001/api/magpie/admin/review/:openid/[ok/notok/disabled]/:sid
   */
  async review() {
    const {openid, opinion} = this.ctx.params;
    const {openid: reviewBy} = this.ctx.wxuser;

    const isOpinionValid = reviewStatus.indexOf(opinion) >= 0;
    if (!isOpinionValid) {
      this.ctx.body = {
        success: false,
      };
      return;
    }
    const result = await this.ctx.service.magpie.review({
      status: opinion,
      reviewBy,
      openid,
    });
    this.ctx.body = {
      success: result,
    };
  }
  /**
   * curl 127.0.0.1:7001/api/magpie/admin/jupiter/:sid
   */
  async jupiter() {
    const items = await this.ctx.service.magpie.oneAnother();
    const wxIds = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      wxIds.push(item.fromWxid, item.toWxid);
    }
    const uniqeIds = Array.from(new Set(wxIds.filter(i => !!i)));
    const users = await this.service.magpie.queryUserInfo(uniqeIds);
    const wxId2Info = {};
    if (users) {
      // @ts-ignore
      users.reduce((pre, u) => {
        pre[u.wechatOpenid] = u;
        return pre;
      }, wxId2Info);
    }

    this.ctx.body = {
      success: true,
      data: {
        items,
        userInfo: wxId2Info,
      },
    };
  }
}

module.exports = MagpieController;
