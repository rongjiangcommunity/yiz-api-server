import Redis_ = require('ioredis');

declare global {
  module MyTypes {
    export type Redis = Redis_.Redis;
  }
}
export {}

