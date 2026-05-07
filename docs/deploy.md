# Deployment

Live site: https://baditaflorin.github.io/chladni-plate-visualizer/

Mode A uses GitHub Pages only.

## Publish

```sh
make build
git add docs
git commit -m "ops: publish pages build"
git push origin main
```

GitHub Pages serves the `main` branch `/docs` directory.

## Rollback

Revert the publishing commit that changed `docs/`, then push `main` again.

## Custom Domain

No custom domain is configured for v1. If one is added, place a `CNAME` file in `docs/` and configure DNS with the GitHub Pages records documented at https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site.
