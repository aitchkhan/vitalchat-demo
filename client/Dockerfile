FROM node:10-alpine as builder

WORKDIR /client
COPY package*.json ./
RUN npm install

ARG VC_SERVER_URL=https://alb-signal.vitalchat.com
ARG API_SERVER_URL=http://localhost:3000

ENV VC_SERVER_URL=${VC_SERVER_URL}
ENV API_SERVER_URL=${API_SERVER_URL}

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /client/dist/ /usr/share/nginx/html/

COPY ./entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
