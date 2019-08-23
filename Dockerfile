FROM node:12.7.0

# Bundle app source
# ADD . /nodeproj

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install -g forever

RUN npm install

COPY . .