Desde navegador

API básica: abre http://localhost:3001/test y valida respuesta {"message":"ok"}.
Métricas: abre http://localhost:3001/metrics y valida que aparezcan métricas tipo http_request_duration_seconds y process_.
Prometheus targets: abre http://localhost:9090/targets y valida nestjs_app en estado UP.
Prometheus query: en http://localhost:9090/graph ejecuta up y luego rate(http_request_duration_seconds_count[1m]).
Grafana: abre http://localhost:3002, entra (normalmente admin/admin si no cambió), y confirma que el dashboard de NestJS carga datos.

Desde terminal

Levantar stack en prod: docker compose up -d --build.
Verificar contenedores: docker compose ps (deben estar Up).
Smoke test API: curl -i http://localhost:3001/test.
Validar métricas: curl -s http://localhost:3001/metrics | head -n 30.
Generar tráfico y revalidar: for i in {1..50}; do curl -s http://localhost:3001/test >/dev/null; done && curl -s http://localhost:3001/metrics | grep http_request_duration_seconds_count.
Confirmar scraping Prometheus: curl -s 'http://localhost:9090/api/v1/query?query=up'.
Revisar logs en modo prod: docker logs --tail 100 nestjs-api (deben verse logs estructurados, no formato “pretty” de desarrollo).
Si quieres, te preparo una “secuencia rápida” de 6 comandos para correr todo en orden y detectar fallos en menos de 2 minutos.