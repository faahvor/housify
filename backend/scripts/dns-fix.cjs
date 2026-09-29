// Preloaded via NODE_OPTIONS in package.json scripts.
// Some local network DNS resolvers fail to resolve the MongoDB Atlas
// SRV record (ESERVFAIL), even though the record itself is fine. Pointing
// Node's resolver at a public DNS server works around that.
require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
