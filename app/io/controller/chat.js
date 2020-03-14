'use strict';

/**
 * https://eggjs.org/zh-cn/tutorials/socketio.html
 */
// @ts-ignore
module.exports = app => {
  class Controller extends app.Controller {
    async index() {
      const message = this.ctx.args[0];
      this.ctx.logger.warn('chat', 'message='+message, 'pid='+process.pid);
      const say = await this.ctx.service.ws.hello();
      this.ctx.socket.emit('res', say);
    }
  }
  return Controller;
};
