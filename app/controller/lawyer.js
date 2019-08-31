'use strict';

const Controller = require('egg').Controller;

class LawyerController extends Controller {
  /**
   * GET /api/lawyer/lawyers/:sid
   * 律师列表
   * curl 127.0.0.1:7001/api/lawyer/lawyers/:sid
   */
  async lawyers() {
    // await this.service.lawyer.insert();
    const data = await this.service.lawyer.lawyers();
    this.ctx.body = {
      data,
      success: true,
    };
  }
  /**
   * POST /api/lawyer/msg/open/:sid
   * 打开留言
   * curl '127.0.0.1:7001/api/lawyer/msg/open/:sid' -H 'content-type: application/json' --data-binary '{"msg":"打开一个律师测试留言","fromUid":1,"toUid":2}'
   */
  async openMsg() {
    const user = this.ctx.user;
    const {fromUid, toUid, msg} = this.ctx.request.body;
    if (fromUid === toUid) {
      this.ctx.status = 403;
      return;
    }
    if (user && String(user.id) !== String(fromUid)) {
      this.ctx.status = 403;
      return;
    }

    if (!msg) {
      this.ctx.status = 404;
      return;
    }
    // TODO: check toUid is a id of a lawyer

    // 发起咨询前检查是否有已经在进行中的咨询
    const pendings = await this.service.lawyer.queryPendingMsg({fromUid, toUid});
    if (pendings && pendings.length) {
      this.ctx.body = {
        success: false,
        msg: '存在进行中的对话',
      };
      return;
    }
    const result = await this.service.lawyer.openMsg({fromUid, toUid, msg});
    // TODO: send template msg to lawyer of toUid
    this.ctx.body = {
      success: result,
    };
  }
  /**
   * POST /api/lawyer/msg/add/:sid
   * 回复留言
   * pid: 留言 id
   * curl '127.0.0.1:7001/api/lawyer/msg/add/:sid' -H 'content-type: application/json' --data-binary '{"msg":"好的，马上处理","fromUid":2,"toUid":1, "pid":1}'
   */
  async addMsg() {
    const user = this.ctx.user;
    const {fromUid, toUid, msg, pid} = this.ctx.request.body;

    if (!user || String(user.id) !== String(fromUid)) {
      this.ctx.status = 403;
      return;
    }
    if (!msg) {
      this.ctx.status = 404;
      return;
    }
    const result = await this.service.lawyer.addMsg({fromUid, toUid, msg, pid});
    // created, active, finished, closed, timeout
    if (result) {
      // msg status: active
      await this.service.lawyer.activeMsg(pid);
    }
    // TODO: send template msg to user of toUid
    this.ctx.body = {
      success: result,
    };
  }
  /**
   * POST /api/lawyer/msg/close/:sid
   * 关闭留言/对话
   * finished: true if 解决，else false
   * curl '127.0.0.1:7001/api/lawyer/msg/close/:sid' -H 'content-type: application/json' --data-binary '{"finished":true, "id":1}'
   */
  async closeMsg() {
    const user = this.ctx.user;
    const {id, finished} = this.ctx.request.body;
    const meta = await this.service.lawyer.queryMsgMeta(id);
    if (String(meta.fromUid) !== String(user.id) && String(meta.toUid) !== String(user.id)) {
      this.ctx.status = 403;
      return;
    }
    const result = await this.service.lawyer.closeMsg({id, finished, uid: user.id});
    // TODO: send template msg to lawyer
    this.ctx.body = {
      success: result,
    };
  }

  /**
   * POST /api/lawyer/msg/read/:sid/:pid
   * 标记消息已读
   * sid: session id
   * pid: 留言 id
   * curl -X POST '127.0.0.1:7001/api/lawyer/msg/read/:sid/1' -H 'content-type: application/json'
   */
  async markMsgRead() {
    const user = this.ctx.user;
    const {pid} = this.ctx.params;
    if (!user) {
      this.ctx.status = 403;
      return;
    }
    const result = await this.service.lawyer.markMsgRead({pid, uid: user.id});
    this.ctx.body = {
      success: result,
    };
  }
  /**
   * GET /api/lawyer/consulting_me/:sid
   * offset: 指定起始位置下标
   * count: 指定返回数量
   * type: undone | done
   *
   * curl 127.0.0.1:7001/api/lawyer/consulting_me/:sid?offset=0&count=10&type=undone
   */
  async consultingMe() {
    const user = this.ctx.user;
    if (!user) {
      this.ctx.status = 403;
      return;
    }
    const validTypes = ['undone', 'done'];
    let {offset, count, type} = this.ctx.query;
    offset = posiveNumber(offset) ? Number(offset) : 0;
    count = posiveNumber(count) ? Number(count) : 10;

    if (validTypes.indexOf(type) < 0) {
      type = validTypes[0];
    }

    const isLawyer = await this.service.lawyer.isLawyer(user.id);
    if (!isLawyer) {
      this.ctx.body = {
        success: false,
        msg: 'not a lawyer',
      };
      return;
    }
    const data = await this.service.lawyer.consultingMe({
      offset, count, type,
      uid: user.id,
    });
    this.ctx.body = {
      success: true,
      data,
    };
  }
  /**
   * GET /api/lawyer/my_consulting/:sid
   * offset: 指定起始位置下标
   * count: 指定返回数量
   * type: undone | done
   *
   * curl 127.0.0.1:7001/api/lawyer/my_consulting/:sid?offset=0&count=10&type=undone
   */
  async myConsulting() {
    const user = this.ctx.user;
    if (!user) {
      this.ctx.status = 403;
      return;
    }
    const validTypes = ['undone', 'done'];
    let {offset, count, type} = this.ctx.query;
    offset = posiveNumber(offset) ? Number(offset) : 0;
    count = posiveNumber(count) ? Number(count) : 10;

    if (validTypes.indexOf(type) < 0) {
      type = validTypes[0];
    }
    const data = await this.service.lawyer.myConsulting({
      offset, count, type,
      uid: user.id,
    });
    this.ctx.body = {
      success: true,
      data,
    };
  }
  /**
   * GET /api/lawyer/msg/:sid/:pid
   * 获取消息列表
   * 状态说明
   * 咨询中: created|active
   * 已完成: closed|finished
   * 超时关闭: timeout
   *
   * curl 127.0.0.1:7001/api/lawyer/msg/:sid/1
   */
  async queryMsg() {
    const user = this.ctx.user;
    if (!user) {
      this.ctx.status = 403;
      return;
    }
    const {pid} = this.ctx.params;
    let {offset, count} = this.ctx.query;

    offset = posiveNumber(offset) ? Number(offset) : 0;
    count = posiveNumber(count) ? Number(count) : 100;

    const meta = await this.service.lawyer.queryMsgMeta(pid);
    if (!meta) {
      this.ctx.status = 404;
      return;
    }
    if (String(meta.fromUid)!==String(user.id) && String(meta.toUid)!==String(user.id)) {
      this.ctx.status = 403;
      return;
    }
    const users = await this.service.lawyer.queryUserInfo([meta.fromUid, meta.toUid]) || [];
    const data = await this.service.lawyer.queryMsg({pid, offset, count});
    this.ctx.body = {
      success: true,
      data: {
        user: {
          // @ts-ignore
          [meta.fromUid]: users.find(u => u.id === meta.fromUid),
          // @ts-ignore
          [meta.toUid]: users.find(u => u.id === meta.toUid),
        },
        top: meta,
        list: data,
      },
    };
  }
  /**
   * GET /api/lawyer/is_lawyer/:sid
   * 是否律师
   * curl 127.0.0.1:7001/api/lawyer/is_lawyer/:sid
   */
  async isLawyer() {
    const {openid} = this.ctx.wxuser;
    if (!openid) {
      this.ctx.status = 403;
      return;
    }
    const result = await this.service.lawyer.isLawyerByOpenid(openid);
    this.ctx.body = {
      success: true,
      data: result,
    };
  }
  /**
   * GET /api/lawyer/has_unread/:sid
   * 是否有未读留言
   * curl 127.0.0.1:7001/api/lawyer/has_unread/:sid
   */
  async hasUnread() {
    const user = this.ctx.user;

    if (!user) {
      this.ctx.status = 403;
      return;
    }
    const result = await this.service.lawyer.hasUnread({uid: user.id});
    this.ctx.body = {
      success: true,
      data: result,
    };
  }
  /**
   * GET /api/lawyer/msg/delay/:sid
   * 是否有超时留言，默认24小时律师未回复
   * 参数
   * hours: 超时时间，按小时， 默认 24
   * offset: 指定起始位置下标
   * count: 指定返回数量
   *
   * curl 127.0.0.1:7001/api/lawyer/msg/delay/:sid?hours=24&offset=0&count=32
   */
  async queryDelay() {
    let {offset, count, hours} = this.ctx.query;

    offset = posiveNumber(offset) ? Number(offset) : 0;
    count = posiveNumber(count) ? Number(count) : 100;
    hours = posiveNumber(hours) ? Number(hours) : 24;
    const result = await this.service.lawyer.queryDelay({offset, count, hours});
    this.ctx.body = {
      success: true,
      data: result,
    };
  }
  async stat() {
    const result = await this.service.lawyer.stat();
    this.ctx.body = {
      success: true,
      data: result,
    };
  }
}
/**
 * @param {*} n
 */
function posiveNumber(n) {
  return Number(n) > 0;
}

module.exports = LawyerController;
