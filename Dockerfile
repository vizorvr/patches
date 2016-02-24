FROM node:argon

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
RUN npm install --silent --unsafe-perm

RUN ./node_modules/.bin/gulp golive

RUN node ./tools/editorBundler.js

CMD forever ./app.js
