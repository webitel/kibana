FROM node:slim
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"

ENV VERSION
ENV WEBITEL_MAJOR 3.3
ENV WEBITEL_REPO_BASE https://github.com/webitel
ENV KIBANA_VERSION 4.5.2

RUN mkdir /kibana
COPY bin /kibana/bin
COPY src /kibana/src
COPY optimize /kibana/optimize
COPY config /kibana/config
COPY plugins /kibana/plugins
COPY LICENSE.txt /kibana/
ENV PATH /kibana/bin:$PATH

ENV NODE_TLS_REJECT_UNAUTHORIZED 0

RUN cd /kibana && npm install && npm cache clear && \
    cd /kibana/installedPlugins/webitel && npm install && npm cache clear

COPY ./entrypoint.sh /

WORKDIR /kibana
EXPOSE 5601
ENTRYPOINT ["/entrypoint.sh"]
CMD ["kibana"]
