FROM node:8.14-alpine
LABEL maintainer="Vitaly Kovalyshyn"

ENV VERSION
ENV WEBITEL_MAJOR 3.11
ENV WEBITEL_REPO_BASE https://github.com/webitel
ENV KIBANA_VERSION 6.5.4

COPY ../elastic/build/default/kibana-6.5.4-SNAPSHOT-linux-x86_64 /kibana
COPY kibana.ym /kibana/config/

ENV PATH /kibana/bin:$PATH
ENV NODE_TLS_REJECT_UNAUTHORIZED 0

COPY ./entrypoint.sh /

WORKDIR /kibana
EXPOSE 5601
ENTRYPOINT ["/entrypoint.sh"]
CMD ["kibana"]
