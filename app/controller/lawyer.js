'use strict';

const Controller = require('egg').Controller;

// https://www.yuque.com/oqh30u/help/xpy1uo
const msgTemplateId = '8xm2s0NOYD12-hKD3GT7m4iwsPmHxe-ET079-svjjvg';

class LawyerController extends Controller {
  /**
   * GET /api/lawyer/lawyers/:sid
   * 律师列表
   * curl 127.0.0.1:7001/api/lawyer/lawyers/:sid
   */
  async lawyers() {
    const data = await this.service.lawyer.lawyers();
    this.ctx.body = {
      data,
      success: true,
    };
  }
  /**
   * GET /api/lawyer/query/:id/:sid
   * 查询律师资料
   *
   * curl 127.0.0.1:7001/api/lawyer/query/16/:sid
   */
  async lawyer() {
    const {id} = this.ctx.params;
    const data = await this.service.lawyer.lawyer(id);
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
    // send template msg to lawyer of toUid
    if (result) {
      const {g3, period, name} = this.ctx.user;
      const lawyer = await this.service.user.queryById(toUid);
      if (lawyer) {
        const formId = await this.ctx.helper.getFormId(user.appid, lawyer.wechatOpenid);
        if (formId) {
          const note = `${lawyer.name}律师，${period}届${g3}班${name}向你提交法律咨询留言，点击查看详情。`;
          const accesstoken = await this.service.wechat.accessToken({appid: user.appid});
          const date = new Date().toLocaleString('cn', {timeZone: 'Asia/Shanghai'});
          // TODO: result has no pid
          // const page = `pages/lawyer/add_msg/index?pid=${pid}`;
          const page = `pages/lawyer/consult_me/index`;
          this.service.notification.send({
            accessToken: accesstoken.access_token,
            templateId: msgTemplateId,
            openid: lawyer.wechatOpenid,
            formId,
            page,
          }, [note, date], null);
        }
      }
    }
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
      // send template msg to user of toUid
      const meta = await this.service.lawyer.queryMsgMeta(pid);
      if (meta) {
        const isLawyerFeedback = String(meta.toUid)===String(fromUid);
        const anotherUser = await this.service.user.queryById(toUid);
        if (anotherUser) {
          const formId = await this.ctx.helper.getFormId(user.appid, anotherUser.wechatOpenid);
          if (formId) {
            const lawyer = isLawyerFeedback?user:anotherUser;
            const xiaoyou = isLawyerFeedback?anotherUser:user;
            const note = isLawyerFeedback ? `${xiaoyou.name}，${lawyer.name}律师已经回复您的咨询，点击查看详情。` :
            `${lawyer.name}律师，${xiaoyou.period}届${xiaoyou.g3}班${xiaoyou.name}咨询有新的留言，点击查看详情。`;
            const accesstoken = await this.service.wechat.accessToken({appid: user.appid});
            const date = new Date().toLocaleString('cn', {timeZone: 'Asia/Shanghai'});
            // page is msg list
            const page = `pages/lawyer/add_msg/index?pid=${pid}`;
            this.service.notification.send({
              accessToken: accesstoken.access_token,
              templateId: msgTemplateId,
              openid: lawyer.wechatOpenid,
              formId,
              page,
            }, [note, date], null);
          }
        }
      }
    }
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
    // send template msg to lawyer
    if (result) {
      const lawyer = await this.service.user.queryById(meta.toUid);
      if (lawyer) {
        const formId = await this.ctx.helper.getFormId(user.appid, lawyer.wechatOpenid);
        if (formId) {
          const {g3, period, name} = this.ctx.user;
          const note = `${lawyer.name}律师，${period}届${g3}班${name}已经关闭咨询，感谢您的付出，点击查看详情。`;
          const accesstoken = await this.service.wechat.accessToken({appid: user.appid});
          const date = new Date().toLocaleString('cn', {timeZone: 'Asia/Shanghai'});
          const page = 'pages/lawyer/my_consult/index';
          this.service.notification.send({
            accessToken: accesstoken.access_token,
            templateId: msgTemplateId,
            openid: lawyer.wechatOpenid,
            formId,
            page,
          }, [note, date], null);
        }
      }
    }
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
   * GET /api/lawyer/lawyer_has_unread/:sid
   * 律师是否有未读消息
   * curl 127.0.0.1:7001/api/lawyer/lawyer_has_unread/:sid
   */
  async lawyerHasUnread() {
    const user = this.ctx.user;

    if (!user) {
      this.ctx.status = 403;
      return;
    }
    const result = await this.service.lawyer.lawyerHasUnread({uid: user.id});
    this.ctx.body = {
      success: true,
      data: result,
    };
  }
  /**
   * GET /api/lawyer/user_has_unread/:sid
   * 用户是否有未读留言
   * curl 127.0.0.1:7001/api/lawyer/user_has_unread/:sid
   */
  async userHasUnread() {
    const user = this.ctx.user;

    if (!user) {
      this.ctx.status = 403;
      return;
    }
    const result = await this.service.lawyer.userHasUnread({uid: user.id});
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
    hours = posiveNumber(hours) ? Number(hours) : 1;
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
