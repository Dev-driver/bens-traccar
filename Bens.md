# Traccar — Build & Run Guide

## Prerequisites

- Java 17 — download from [https://adoptium.net](https://adoptium.net) and install
- Node.js / npm — download from [https://nodejs.org](https://nodejs.org)
- Git — download from [https://git-scm.com](https://git-scm.com)

---

## Step 1 — Build the Traccar backend

**macOS / Linux**
```bash
cd traccar
./gradlew assemble
```

**Windows**
```cmd
cd traccar
gradlew.bat assemble
```

Output artifacts:
- JAR: `target/tracker-server.jar`
- Dependencies: `target/lib/`

---

## Step 2 — Initialize the traccar-web submodule

```bash
git submodule update --init --recursive
```

*(same on all platforms)*

---

## Step 3 — Build the traccar-web frontend

```bash
cd traccar-web
npm install
npm run build
cd ..
```

*(same on all platforms)*

Output: `traccar-web/build/`

---

## Step 4 — Link the frontend and prepare config

**macOS / Linux**
```bash
ln -sfn "$(pwd)/traccar-web/build" "$(pwd)/web"
mkdir -p data logs
cp setup/traccar.xml traccar.xml
```

**Windows**
```cmd
mklink /D web traccar-web\build
mkdir data
mkdir logs
copy setup\traccar.xml traccar.xml
```

> On Windows, `mklink` requires running the terminal as **Administrator**.

---

## Step 5 — Start the server

**macOS / Linux**
```bash
java -jar target/tracker-server.jar traccar.xml
```

**Windows**
```cmd
java -jar target\tracker-server.jar traccar.xml
```

The server starts on **http://localhost:8082**.

Logs are written to `logs/tracker-server.log`.

---

## Notes

- All commands in steps 1–5 assume you are inside the `traccar/` subdirectory.
- The H2 embedded database is used by default (stored in `data/database`).
- Liquibase runs database migrations automatically on startup.
- Steps 1, 3, and 4 only need to be re-run when source code changes. To just restart the server, only Step 5 is needed.
