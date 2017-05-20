# docker-discover-tasks

Distributed discovery of docker service tasks


Design
---

Revised (clean up and use pieces from below):
- Provide GET <hostname>:<port>/register which allows host to register hostname and IP
- On start up, discover all tasks and for each task request <hostname>:<port>/register


TODO: need to modify as nslookup doesn't return task ids and so will need to create service that can be queried for hostname. Can use os.hostname()
- Uses /etc/hosts file in each container to maintain list so that there is no single point of failure
- Provides API, at <host>:<port>, which uses nslookup (via node) to query `tasks.<service-name>` to get list of containers and populates/replaces `<service-name>.<task-id>` entries in /etc/hosts.
- During startup, uses localhost:<port> to discover hosts and then calls <host>:<port> for each of the discovered hosts
