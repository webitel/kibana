FROM node:slim
MAINTAINER Vitaly Kovalyshyn "v.kovalyshyn@webitel.com"

ENV VERSION
ENV WEBITEL_MAJOR 3.5
ENV WEBITEL_REPO_BASE https://github.com/webitel
ENV KIBANA_VERSION 5.0.0

RUN mkdir /kibana
COPY bin /kibana/bin
COPY config /kibana/config
COPY data /kibana/data
COPY optimize /kibana/optimize
COPY plugins /kibana/plugins
COPY src /kibana/src
COPY webpackShims /kibana/webpackShims

COPY package.json /kibana/

ENV PATH /kibana/bin:$PATH

ENV NODE_TLS_REJECT_UNAUTHORIZED 0

RUN apt-get update && apt-get install -y --force-yes git build-essential python python-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    cd /kibana && npm install && npm cache clear && \
    ./bin/kibana-plugin install https://github.com/prelert/kibana-swimlane-vis/releases/download/v5.0.0/prelert_swimlane_vis-5.0.0.zip && \
    cd /kibana/plugins && git clone https://github.com/mstoyano/kbn_c3js_vis.git c3_charts && cd c3_charts && npm install && npm cache clear && \
    cd /kibana/plugins/webitel && npm install && npm cache clear

COPY ./entrypoint.sh /

WORKDIR /kibana
EXPOSE 5601
ENTRYPOINT ["/entrypoint.sh"]
CMD ["kibana"]
