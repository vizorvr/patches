FROM vizor/boron

ENV HOME=/root \
    ENGI_BIND_IP=0.0.0.0 \
    NODE_ENV=production \
    TMPDIR=/tmp

EXPOSE 8000

RUN npm config set loglevel error --silent

# install our dependencies and nodejs
RUN npm install -g forever

# use changes to package.json to force Docker not to use the cache
# when we change our application's dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && \
    yarn --pure-lockfile && \
    yarn cache clean && \
    mkdir -p /opt/app && \
    mv /tmp/node_modules /opt/app/

COPY . /opt/app
WORKDIR /opt/app

RUN ./node_modules/.bin/gulp golive \
  && sh bin/bundler.sh

CMD forever ./app.js
