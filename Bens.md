# Traccar — Build & Run Guide

## Prerequisites

- macOS with [Homebrew](https://brew.sh) installed
- Node.js / npm

---

## Step 1 — Build the Traccar backend

```bash
cd traccar
./gradlew assemble
```

Output artifacts:
- JAR: `target/tracker-server.jar`
- Dependencies: `target/lib/`

---

## Step 2 — Initialize the traccar-web submodule

```bash
git submodule update --init --recursive
```

---

## Step 3 — Build the traccar-web frontend

```bash
cd traccar-web
npm install
npm run build
cd ..
```

Output: `traccar-web/build/`

---

## Step 4 — Link the frontend and prepare config

```bash
ln -sfn "$(pwd)/traccar-web/build" "$(pwd)/web"
mkdir -p data logs
cp setup/traccar.xml traccar.xml
```

---

## Step 5 — Start the server

```bash
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
java -jar target/tracker-server.jar traccar.xml
```

The server starts on **http://localhost:8082**.

Logs are written to `logs/tracker-server.log`.

---

## Notes

- All commands in steps 2–6 assume you are inside the `traccar/` subdirectory.
- The H2 embedded database is used by default (stored in `data/database`).
- Liquibase runs database migrations automatically on startup.
- Steps 2–5 only need to be re-run when source code changes. To just restart the server, only Step 6 is needed.
