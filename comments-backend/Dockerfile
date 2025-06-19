FROM node:22

WORKDIR /app

RUN apt-get update && \
    apt-get install -y netcat-openbsd redis-tools && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8888

COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]