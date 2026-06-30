# Sound of Popularity

An interactive D3 story about Spotify genre fingerprints, K-pop production traits, and genre-specific popularity signals.

The app focuses on five traits throughout:

- Tempo
- Speechiness
- Danceability
- Energy
- Loudness

## Data

This project combines:

- Pre-analyzed Observable summary tables in `f7d11845f8925709/files/`
- The Hugging Face Spotify tracks dataset at `data/spotify_tracks.csv`

The Spotify track file is included so the app can run from GitHub Pages without a build step or server-side data fetch.

## Run Locally

```sh
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## GitHub Pages Hosting

After this repo is pushed to GitHub:

1. Open the repository on GitHub.
2. Go to **Settings**.
3. Open **Pages** in the left sidebar.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Set **Branch** to `main` and folder to `/ (root)`.
6. Click **Save**.
7. Wait for GitHub Pages to publish the site.

The live URL will usually be:

```text
https://YOUR_USERNAME.github.io/sound_of_popularity/
```

## Notes

Spotify embeds require internet access and may require a Spotify login for full playback. The app also includes Web Audio sketch buttons as quick trait-based listening cues.

## Contributing

This repository is public. Anyone can fork it and open a pull request with edits. Maintainers can then review and merge those changes.

See `CONTRIBUTING.md` for the edit workflow.
# soundsvisualize
