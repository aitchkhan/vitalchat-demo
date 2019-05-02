FROM node:10-alpine as builder

WORKDIR /client
COPY package*.json ./
RUN npm install

ARG API_SERVER_URL=http://localhost:9000
ENV API_SERVER_URL=${API_SERVER_URL}

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /client/dist/ /usr/share/nginx/html/

COPY ./entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
