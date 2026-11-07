# Connection Tests

## Connection chain

```text
Browser
   |
   v
API on Windows (NestJS, default port 3001)
   |                         |
   v                         v
PostgreSQL on Ubuntu      Redis on Ubuntu
   (default port 5432)      (default port 6379)
```

The API connects to PostgreSQL through Prisma and `DATABASE_URL`. Redis is an optional configured service; when `REDIS_URL` is set, the API health check also requires Redis to respond.

## Run the tests

Run commands from the `api` directory in PowerShell. The scripts load the repository-root `.env` if present; process environment variables take precedence.

| Test | Command | PASS means |
|---|---|---|
| Network | `npm run test:network` | TCP connections to configured database, Redis, and optional SSH endpoints succeed. ICMP ping is reported separately because networks may block ping. |
| Database | `npm run test:db` | Prisma ran the PostgreSQL queries, used and rolled back the temporary-table transaction, then listed public tables. |
| Redis | `npm run test:redis` | Redis answered PING and a temporary SET/GET/DEL check. It is skipped if `REDIS_URL` is unset. |
| API | `npm run test:api` | `/health` returned success; Swagger is checked at `/api/docs` when present. |
| All | `npm run test:connections` | The tests ran in network, database, Redis, API order. The first failing step stops subsequent steps. |

Each individual script exits with code 0 on success and 1 on failure. A failed TCP check usually means the host is unreachable, the VPN/tunnel is down, a firewall blocks the port, or the service is not listening. A failed ping alone may only mean ICMP is blocked.

The API health endpoint is `GET /health`. It runs a lightweight database query and, when `REDIS_URL` is configured, a Redis PING. It returns HTTP 503 when a configured dependency is down and does not include credentials or internal error details. Swagger documents the route at `/api/docs`.

## SSH tunnel

Configure `SSH_USER` and `SSH_HOST` in the root `.env`, then run in PowerShell:

```powershell
.\scripts\connection-tests\open-tunnel.ps1
```

The tunnel forwards local port 5433 to port 5432 on the Ubuntu server. While it is running, set the database URL and network-test variables to the local forwarded port, for example:

```text
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5433/DATABASE?schema=public
DB_HOST=localhost
DB_PORT=5433
```

Use your own local environment values; never commit credentials. Stop the foreground tunnel with `Ctrl+C`.

## Troubleshooting

| Error | Probable cause | Fix |
|---|---|---|
| `ECONNREFUSED` | The host is reachable but nothing is listening on the requested port, or the connection is rejected. | Check PostgreSQL/Redis service status and listen port; verify tunnel forwarding and firewall rules. |
| `ETIMEDOUT` | VPN/routing/firewall drop, inaccessible host, or an inactive SSH tunnel. | Connect to the VPN, verify the host and route, inspect firewall rules, or open the SSH tunnel. |
| `password authentication failed` | Incorrect database username/password or credentials do not match the database. | Correct the credentials in the local `.env`/`DATABASE_URL`; verify the PostgreSQL role on the server. |
| `no pg_hba.conf entry` | PostgreSQL client authentication rules do not allow this client address/database/user combination. | Add a narrowly scoped `host` rule for the intended database, user, and VPN/client CIDR; reload PostgreSQL. Avoid broad public access. |
| `database does not exist` | The database name in `DATABASE_URL` is missing or misspelled. | Confirm the database name and create it on the server if appropriate. |
| Prisma `P1001` | Prisma cannot reach the database server. | Check `DATABASE_URL`, DNS/VPN, firewall, PostgreSQL listener, and SSH tunnel. |
| Redis unavailable | Redis is stopped, unreachable, misconfigured, or requires different authentication/TLS options. | Verify Redis service status and `REDIS_URL`, then check network/firewall access and Redis credentials/TLS requirements. |

## Ubuntu-side checks

Run these commands on the Ubuntu database server:

```sh
sudo systemctl status postgresql
pg_isready
sudo ss -tlnp | grep 5432
sudo ufw status
```

In the active `postgresql.conf`, check `listen_addresses`. It must include the server's appropriate private/VPN interface (or another deliberately selected interface) for remote TCP access. Do not expose PostgreSQL broadly unless that is an intentional, secured configuration.

In `pg_hba.conf`, check for a `host` rule matching the intended database, user, and client/VPN CIDR. After a configuration change, reload PostgreSQL, for example with `sudo systemctl reload postgresql`.

## Results log

| Date | Test | Command | Result (OK or KO) | Remarks |
|---|---|---|---|---|
| YYYY-MM-DD | Network | `npm run test:network` | OK / KO | |
| YYYY-MM-DD | Database | `npm run test:db` | OK / KO | |
| YYYY-MM-DD | Redis | `npm run test:redis` | OK / KO | |
| YYYY-MM-DD | API | `npm run test:api` | OK / KO | |

## Latest observed run

| Date | Test | Command | Result (OK or KO) | Remarks |
|---|---|---|---|---|
| 2026-11-06 | Network | `npm run test:connections` | KO | ICMP to localhost passed; TCP ports 5432 and 6379 were refused. SSH was not configured. |
| 2026-11-06 | Database | `npm run test:db` | KO | Prisma reported P1001; no PostgreSQL listener was reachable at the configured localhost endpoint. |
| 2026-11-06 | Redis | `npm run test:redis` | KO | Redis refused the configured localhost connection. |
| 2026-11-06 | API | `npm run test:api` | KO | The API was not running for the direct script run. A separate live probe returned `/health` HTTP 503 (database and Redis down) and `/api/docs` HTTP 200. |

## Assumptions

- The API package is the repository's npm package, so all `npm run` commands are run from `api`.
- The root `.env` is the canonical environment file, matching the API and Docker Compose configuration.
- PostgreSQL is the project's database and Redis is planned/configured in Compose; Redis remains optional when `REDIS_URL` is unset.
- The database write check uses a PostgreSQL temporary table inside a transaction that is deliberately rolled back. It does not modify persistent application data.
- The API port defaults to 3001, PostgreSQL to 5432, Redis to 6379, SSH to 22, and the local SSH-forward port to 5433.
