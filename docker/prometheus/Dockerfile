FROM prom/prometheus:latest

COPY prometheus.yml /etc/prometheus/prometheus.yml

USER root
RUN chown -R 65534:65534 /etc/prometheus/prometheus.yml
USER 65534