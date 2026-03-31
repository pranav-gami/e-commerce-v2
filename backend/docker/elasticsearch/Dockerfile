FROM docker.elastic.co/elasticsearch/elasticsearch:8.12.0

# Disable security (dev only)
ENV discovery.type=single-node
ENV xpack.security.enabled=false
ENV ES_JAVA_OPTS="-Xms512m -Xmx512m"

# Expose port
EXPOSE 9200