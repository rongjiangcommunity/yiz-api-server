'use strict';

module.exports = app => {
  class Ws extends app.Service {
    async hello() {
      return 'Hello!';
    }
    async status() {
      return 'success';
    }
  }
  return Ws;
};
