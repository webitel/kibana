FROM node:slim
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"

ENV VERSION
ENV WEBITEL_MAJOR 3.3
ENV WEBITEL_REPO_BASE https://github.com/webitel
ENV KIBANA_VERSION 4.5.2

RUN mkdir /kibana
COPY bin /kibana/bin
COPY config /kibana/config
COPY installedPlugins /kibana/installedPlugins
COPY optimize /kibana/optimize
COPY src /kibana/src
COPY tasks /kibana/tasks
COPY webpackShims /kibana/webpackShims

COPY package.json /kibana/
COPY Gruntfile.js /kibana/

ENV PATH /kibana/bin:$PATH

ENV NODE_ENV production
ENV NODE_TLS_REJECT_UNAUTHORIZED 0

RUN apt-get update && apt-get install -y --force-yes git build-essential python python-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    cd /kibana && npm install && npm cache clear && \
    cd /kibana/installedPlugins/webitel && npm install && npm cache clear

COPY ./entrypoint.sh /

WORKDIR /kibana
EXPOSE 5601
ENTRYPOINT ["/entrypoint.sh"]
CMD ["kibana"]
