# Stage 1: Build Angular application
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build -- --configuration=production

# Stage 2: Serve via Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=build /usr/src/app/dist/frontend/browser /usr/share/nginx/html

# Inject custom configuration to support Angular HTML5 routing (fallback to index.html)
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html =404; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
