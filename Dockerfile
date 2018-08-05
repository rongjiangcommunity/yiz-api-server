FROM node:carbon

ENV HOME="/home/admin"

ENV NPM_CONFIG_PREFIX=/home/admin/.npm-global
ENV PATH=$PATH:/home/admin/.npm-global/bin
ENV NODE_ENV=production

WORKDIR "/home/admin/wechat-auth"

EXPOSE 80
EXPOSE 7001

COPY . /home/admin/wechat-auth

# RUN chmod +x /home/admin/wechat-auth/*.sh
RUN npm install --production

CMD [ "npm", "run", "start" ]
# ENTRYPOINT ["/home/admin/wechat-auth/start.sh"]
