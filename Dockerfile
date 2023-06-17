FROM node:18
WORKDIR /usr/src/app
COPY . .
RUN npm install
ENV PORT=8000
EXPOSE ${PORT}
CMD [ "npm", "start" ]
