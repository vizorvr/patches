FROM buildpack-deps:jessie

# gpg keys listed at https://github.com/nodejs/node
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
  done

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 4.2.6

ENV HOME /root
ENV NODE_ENV production
ENV ENGI_BIND_IP 0.0.0.0
ENV RETHINKDB_HOST rethink
ENV MONGODB mongodb://mongo:27017/vizor
ENV GRIDFS mongodb://mongo:27017/vizor-assets
EXPOSE 8000

RUN apt-get -q update
RUN apt-get install -y graphicsmagick

ADD . /usr/src/app

WORKDIR /usr/src/app

RUN npm install --silent -g forever
RUN npm install --unsafe-perm

RUN ./node_modules/.bin/gulp

RUN node ./tools/editorBundler.js

CMD forever ./app.js
