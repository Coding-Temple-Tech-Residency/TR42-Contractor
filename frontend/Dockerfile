FROM node:22-alpine
WORKDIR /app
COPY package.json .
COPY . .
RUN npm install
EXPOSE 8081 19000 19001 19002
ENV CHOKIDAR_USEPOLLING=true
CMD ["npx","expo","start","--tunnel"]