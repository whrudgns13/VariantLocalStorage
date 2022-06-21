FROM node:alpine

WORKDIR /usr/app

RUN npm set @sap:registry=https://npm.sap.com

COPY . .

RUN npm install @sap/generator-fiori

EXPOSE 8080

CMD ["npm", "run", "start-noflp"]