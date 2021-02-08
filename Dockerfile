FROM node:10-alpine

WORKDIR /ffbeEquip

# Install node modules in a first layer (infrequent changes)
COPY package.json package-lock.json ./
RUN npm install

# Install remaining parts (frequent changes)
COPY . ./
RUN npm run build

# Declare that these files must be stored outside of the container filesystem and keep after container deletion
VOLUME /ffbeEquip/static/GL/corrections.json
VOLUME /ffbeEquip/static/JP/corrections.json


EXPOSE 3000
ENTRYPOINT ["npm", "start"]
