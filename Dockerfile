FROM node:carbon

ENV HOME="/home/admin"

ENV NPM_CONFIG_PREFIX=/home/admin/.npm-global
ENV PATH=$PATH:/home/admin/.npm-global/bin
ENV NODE_ENV=production

WORKDIR /home/admin/app

# EXPOSE 80
# EXPOSE 7001

COPY . /home/admin/app

# RUN chmod +x /home/admin/wechat-auth/*.sh
RUN npm install --production

CMD [ "npm", "run", "start" ]
