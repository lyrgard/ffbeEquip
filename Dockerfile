FROM node:10

WORKDIR /ffbeEquip
COPY . ./
RUN npm install
RUN npm run build

EXPOSE 3000

ENTRYPOINT ["npm", "start"]
