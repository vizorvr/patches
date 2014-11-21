FROM node

ENV HOME /root
ENV NODE_ENV production
EXPOSE 8000

CMD [ "node", "app.js" ]

ADD . /usr/src/app

WORKDIR /usr/src/app
RUN npm install

