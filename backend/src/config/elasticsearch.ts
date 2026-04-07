import { Client } from "@opensearch-project/opensearch";

const client = new Client({
  node:process.env.ELASTICSEARCH_URL,
  requestTimeout: 60000,
  pingTimeout: 3000,
});

export default client;
