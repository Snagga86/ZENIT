FROM node:lts-alpine
ENV NODE_ENV=zenitbrain
WORKDIR /usr/zenit/zenitbrain/app
COPY ["./package.json", "./package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --zenitbrain --silent && mv node_modules ../
COPY . .
EXPOSE 3345
EXPOSE 3344
EXPOSE 9123
EXPOSE 1337
EXPOSE 1338
EXPOSE 1339
EXPOSE 1342
EXPOSE 5005
RUN chown -R node /usr/zenit/zenitbrain/app
USER node
CMD ["node", "server-start.js"]