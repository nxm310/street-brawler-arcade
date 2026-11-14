FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY index.html style.css ./
COPY js/ ./js/
COPY assets/ ./assets/

RUN printf 'OK\n' > /usr/share/nginx/html/health

EXPOSE 80
