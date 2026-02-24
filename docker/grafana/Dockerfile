FROM grafana/grafana:10.2.0

# Copiar provisioning (datasources + dashboards config)
COPY provisioning /etc/grafana/provisioning

# Copiar dashboards
COPY dashboards /var/lib/grafana/dashboards

# Permisos (Grafana corre como user grafana)
USER root
RUN chown -R 65534:65534 /etc/grafana /var/lib/grafana
USER 65534