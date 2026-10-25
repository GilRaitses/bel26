# Brazil election live path

An interactive map of Brazil's 2026 presidential runoff count. It shows the official-source count, estimated vote still ahead, regional totals and each candidate's path to 50% plus one.

Click any state for an eased zoom into its municipality-by-municipality count. The map can display estimated votes still ahead, reporting progress or estimated candidate lean. A clickable change feed jumps directly to the state or municipality that just updated, and the interface switches between English and Portuguese.

The browser checks the live national feed every 15 seconds and also checks municipality detail while a state is open. GitHub Actions keeps a durable fallback snapshot every five minutes, deploys it to GitHub Pages and disables the updater after the count reaches 100%.

## Data and method

The page and updater read the public Poliwave election tracker, which attributes its results to Brazil's Superior Electoral Court (TSE). State boundaries come from Code for America and municipality boundaries are loaded on demand from `tbrugz/geodata-br`.

The baseline estimate holds each state or municipality's first-round Lula–Flávio two-way share constant across its unreported valid vote. It describes a plausible counting path, not a forecast or race call.

## Run locally

```sh
node scripts/update-results.mjs
python3 -m http.server 8000 -d public
```

Then open `http://localhost:8000`.
