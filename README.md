# Brazil election live path

An interactive map of Brazil's 2026 presidential runoff count. It shows the official-source count, estimated vote still ahead by state, regional totals and each candidate's path to 50% plus one.

The page reloads its data every minute. GitHub Actions fetches a newer source snapshot every five minutes, deploys it to GitHub Pages and disables the updater after the count reaches 100%.

## Data and method

The updater reads the public Poliwave election tracker, which attributes its results to Brazil's Superior Electoral Court (TSE). The baseline estimate holds each state's first-round Lula–Flávio two-way share constant across its unreported valid vote. It describes a plausible counting path, not a forecast or race call.

## Run locally

```sh
node scripts/update-results.mjs
python3 -m http.server 8000 -d public
```

Then open `http://localhost:8000`.
