/* eslint-disable camelcase */
'use strict';

const Service = require('egg').Service;
const server = 'https://api.weixin.qq.com';

/** @typedef {{[s: string]: {value: string}}} NotificationData */

class NotificationService extends Service {
  /**
   * https://mp.weixin.qq.com/wxopen/tmplmsg?action=self_list&token=1293587518&lang=zh_CN
   * K_Q5XSRaZbDSbJ8SzJFTVMh6wsCv7S4bC90eSRsI7Gs: 实名认证审核通知 [status, note, time, name]
   * K_Q5XSRaZbDSbJ8SzJFTVMh6wsCv7S4bC90eSRsI7Gs: 留言提交成功通知 [name,note,time]
   *
   * https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/template-message.html
   * @param {{accessToken: string, templateId: string, openid: string, formId: string, page: string}} params0
   * @param {string[]} params
   */
  async send({accessToken, templateId, openid, formId, page}, params) {
    const data = params.reduce((pre, item, index) => {
      const key = `keyword${index+1}`;
      // @ts-ignore
      pre[key] = {
        value: String(item),
      };
      return pre;
    }, /** @type {NotificationData} */ {});
    const body = {
      'touser': openid,
      'template_id': templateId,
      'form_id': formId,
      page,
      data,
      'emphasis_keyword': 'keyword1.DATA',
    };
    // eslint-disable-next-line max-len
    const url = `${server}/cgi-bin/message/wxopen/template/send?access_token=${accessToken}`;
    const result = await this.ctx.curl(url, {
      method: 'POST',
      dataType: 'json',
      contentType: 'json',
      data: body,
    });
    this.ctx.logger.info('template_messaging', result && result.data);
    return result && result.data && result.data.errcode===0;
  }
}

module.exports = NotificationService;
