FROM node:carbon

ENV HOME="/home/admin"

ARG APP=miniapp-auth

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
ENV NODE_ENV=production

WORKDIR /home/admin/$APP

EXPOSE 80
EXPOSE 6666

COPY . /home/admin/$APP

RUN chmod +x /home/admin/$APP/*.sh
ENTRYPOINT ["/home/admin/start.sh"]
