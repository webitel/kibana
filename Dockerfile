FROM debian:9-slim
LABEL maintainer="Vitaly Kovalyshyn"

ENV WEBITEL_MAJOR 3.11
ENV WEBITEL_REPO_BASE https://github.com/webitel
ENV KIBANA_VERSION 6.5.4

COPY kibana/build/default/kibana-6.5.4-linux-x86_64 /
COPY kibana.yml /config/
COPY entrypoint.sh /

ENV NODE_TLS_REJECT_UNAUTHORIZED 0
ENTRYPOINT ["/entrypoint.sh"]
EXPOSE 5601
CMD ["kibana"]
