FROM node:argon

ENV HOME=/root \
    ENGI_BIND_IP=0.0.0.0 \
    REDIS=redis \
    NODE_ENV=production \
    MONGODB=mongodb://mongo:27017/vizor \
    GRIDFS=mongodb://mongo:27017/vizor-assets

EXPOSE 8000

# install our dependencies and nodejs
RUN apt-get -q update && \ 
    apt-get install -y graphicsmagick exiftool && \ 
    npm install -g forever

# use changes to package.json to force Docker not to use the cache
# when we change our application's dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && \
    npm install --silent --unsafe-perm && \
    mkdir -p /opt/app && \
    cp -a /tmp/node_modules /opt/app/

ADD . /opt/app
WORKDIR /opt/app

RUN ./node_modules/.bin/gulp golive && \
    node ./tools/editorBundler.js

CMD forever ./app.js
