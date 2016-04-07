FROM node:argon

ENV HOME /root
ENV ENGI_BIND_IP 0.0.0.0
ENV REDIS redis
ENV MONGODB mongodb://mongo:27017/vizor
ENV GRIDFS mongodb://mongo:27017/vizor-assets
EXPOSE 8000

# install our dependencies and nodejs
RUN apt-get -q update
RUN apt-get install -y graphicsmagick

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm install --silent --unsafe-perm
RUN npm install -g forever
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

ADD . /opt/app
WORKDIR /opt/app

RUN ./node_modules/.bin/gulp golive

RUN node ./tools/editorBundler.js

CMD forever ./app.js
