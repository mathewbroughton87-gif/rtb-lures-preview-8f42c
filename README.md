# RTBroughton Lures — static site

A rebuild of the RTBroughton Lures storefront for Ray Broughton (Bargara, Queensland).
The original Wix site is offline; the catalogue and copy here were recovered from
the Internet Archive capture of `rtbroughtonlures.com` and re-built as a static site.

## Preview

Run from this folder:

    python -m http.server 8765

Then open http://127.0.0.1:8765/

Deploying is a straight upload of this folder to any static host. There is no build
step, no framework and no server-side code.

## Structure

    index.html              Home
    shop.html               All 51 lures, filter + sort
    product.html            Product detail, reads ?slug=
    about.html              Ray's story / Catching a Legend
    contact.html            Phone, email, message composer
    assets/css/style.css    All styling
    assets/js/store.js      Product rendering, filters, order list (localStorage)
    assets/img/products/    51 product photos
    assets/img/brand/       Hero, range cards, VHS cover, Starlo post, favicon
    data/products.json      Catalogue source data
    data/products.js        Same data wrapped as window.RTB_DATA for file:// use
    robots.txt

## Catalogue

| Range | Sizes | Lures | Price (AUD) |
|-------|-------|-------|-------------|
| Shaker | 60mm, 80mm | 10 + 10 | $23 / $25 |
| Mover | 80mm, 125mm | 9 + 9 | $25 / $40 |
| Shimmey | — | 13 | $23 |

Prices and product names are taken from the archived shop pages. Stock levels were
not published reliably (the old site showed "Out of stock" across the board), so the
site does not claim stock. Instead every card feeds an order list that is sent to Ray
by phone or SMS, and he confirms availability, postage and payment personally.

## Data provenance and known gaps

- Copy, phone (`0402 476 460`), email (`raytb@me.com`), location (Bargara, QLD) and
  the Steve Starling testimonial are from the archived RTBroughton Lures site.
- Product photos are the original images from the archived product pages, renamed to
  match the new slugs. Several 60mm/80mm and 80mm/125mm pairs share the same source
  photo because the old site reused images between sizes.
- Colourway names were never published as text on the old site, so none are claimed.
  Lures are identified by range, size and number only.
- No specifications beyond what is visible or stated (timber, hand painted, treble
  hooks fitted) are asserted. Dive depth, weight and hook brand are not published.
- `data/products.js` must be regenerated if `data/products.json` is edited. It is a
  one-line wrapper: `window.RTB_DATA = {...};`.

## Editing products

Edit `data/products.json`, then regenerate `data/products.js` (or edit both). Product
image path convention: `assets/img/products/<slug>.jpg`. Slugs are used in
`product.html?slug=<slug>` and in the order-list localStorage key `rtb-cart-v1`.
