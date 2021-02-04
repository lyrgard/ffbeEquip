FROM node:10

WORKDIR /ffbeEquip
COPY . ./
RUN npm install

EXPOSE 3000

ENTRYPOINT ["npm", "start"]
