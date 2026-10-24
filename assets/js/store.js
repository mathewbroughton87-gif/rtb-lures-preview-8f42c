/* RTBroughton Lures - storefront script (vanilla, no build step) */
(function () {
  'use strict';

  var DATA = window.RTB_DATA || { products: [], phone: '0402 476 460', phone_link: '+61402476460' };
  var PRODUCTS = DATA.products;
  var CART_KEY = 'rtb-cart-v1';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function money(n) { return '$' + Number(n).toFixed(0); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function find(slug) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].slug === slug) return PRODUCTS[i];
    return null;
  }
  function rangeLabel(p) { return p.range === 'Shimmey' ? 'Shimmey Range' : p.range + ' ' + p.size; }

  /* ---------- cart ---------- */
  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeCart(c) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {}
    renderCart();
  }
  function cartCount() {
    var c = readCart(), n = 0;
    for (var k in c) n += c[k];
    return n;
  }
  function cartLines() {
    var c = readCart(), out = [];
    for (var slug in c) {
      var p = find(slug);
      if (p) out.push({ product: p, qty: c[slug] });
    }
    return out;
  }
  function cartTotal() {
    return cartLines().reduce(function (t, l) { return t + l.product.price * l.qty; }, 0);
  }
  function addToCart(slug, qty) {
    var p = find(slug);
    if (!p) return;
    var c = readCart();
    c[slug] = (c[slug] || 0) + (qty || 1);
    writeCart(c);
    toast(p.name + ' added to your list');
    openCart();
  }
  function setQty(slug, qty) {
    var c = readCart();
    if (qty <= 0) delete c[slug]; else c[slug] = qty;
    writeCart(c);
  }

  /* ---------- cart drawer ---------- */
  function buildDrawer() {
    if ($('#cartDrawer')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="overlay" id="cartOverlay"></div>' +
      '<aside class="cart-drawer" id="cartDrawer" aria-label="Your order list" aria-hidden="true">' +
      '  <div class="cart-head"><h2>Your list</h2><button class="cart-close" id="cartClose" aria-label="Close">&#10005;</button></div>' +
      '  <div class="cart-items" id="cartItems"></div>' +
      '  <div class="cart-foot">' +
      '    <div class="cart-total"><span>Total (AUD)</span><strong id="cartTotal">$0</strong></div>' +
      '    <a class="btn btn--block" id="cartSms" href="#">Text this order to Ray</a>' +
      '    <a class="btn btn--ghost btn--block" id="cartCall" href="tel:+61402476460">Call Ray - 0402 476 460</a>' +
      '    <button class="btn btn--ghost btn--block" id="cartCopy" type="button">Copy order list</button>' +
      '    <p class="cart-note">This is an order list, not a checkout. Ray confirms availability, postage and payment when you call or text. Prices in AUD.</p>' +
      '  </div>' +
      '</aside>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    $('#cartClose').addEventListener('click', closeCart);
    $('#cartOverlay').addEventListener('click', closeCart);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
    $('#cartCopy').addEventListener('click', function () {
      var text = orderText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast('Order list copied'); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); toast('Order list copied'); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }
  function openCart() {
    buildDrawer();
    $('#cartDrawer').classList.add('is-open');
    $('#cartDrawer').setAttribute('aria-hidden', 'false');
    $('#cartOverlay').classList.add('is-open');
    document.body.classList.add('no-scroll');
  }
  function closeCart() {
    var d = $('#cartDrawer');
    if (!d) return;
    d.classList.remove('is-open');
    d.setAttribute('aria-hidden', 'true');
    $('#cartOverlay').classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }
  function orderText() {
    var lines = cartLines();
    if (!lines.length) return 'Hi Ray, I would like to order some RTBroughton lures.';
    var txt = 'Hi Ray, I would like to order:\n';
    lines.forEach(function (l) {
      txt += l.qty + ' x ' + l.product.name + ' (' + rangeLabel(l.product) + ') - ' + money(l.product.price * l.qty) + '\n';
    });
    txt += 'Total: ' + money(cartTotal()) + '\nName:\nPhone:\nPostal address:\n';
    return txt;
  }
  function renderCart() {
    buildDrawer();
    var lines = cartLines();
    var box = $('#cartItems');
    if (!lines.length) {
      box.innerHTML = '<p class="cart-empty">Your list is empty. Add a few lures from the shop and send the list to Ray.</p>';
    } else {
      box.innerHTML = lines.map(function (l) {
        var p = l.product;
        return '<div class="cart-line">' +
          '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' +
          '<div><h4>' + esc(p.name) + '</h4><p>' + esc(rangeLabel(p)) + ' &middot; ' + money(p.price) + ' each</p></div>' +
          '<div class="line-actions">' +
          '<button type="button" data-dec="' + esc(p.slug) + '" aria-label="Decrease quantity">&minus;</button>' +
          '<span>' + l.qty + '</span>' +
          '<button type="button" data-inc="' + esc(p.slug) + '" aria-label="Increase quantity">+</button>' +
          '</div></div>';
      }).join('');
    }
    $('#cartTotal').textContent = money(cartTotal());
    var sms = $('#cartSms');
    if (sms) sms.href = 'sms:' + DATA.phone_link + '?body=' + encodeURIComponent(orderText());
    $$('.cart-count').forEach(function (el) { el.textContent = cartCount(); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-add],[data-inc],[data-dec],[data-open-cart]') : null;
    if (!t) return;
    if (t.hasAttribute('data-add')) { e.preventDefault(); addToCart(t.getAttribute('data-add'), 1); }
    else if (t.hasAttribute('data-inc')) { var s = t.getAttribute('data-inc'); var c = readCart(); setQty(s, (c[s] || 0) + 1); }
    else if (t.hasAttribute('data-dec')) { var s2 = t.getAttribute('data-dec'); var c2 = readCart(); setQty(s2, (c2[s2] || 0) - 1); }
    else if (t.hasAttribute('data-open-cart')) { e.preventDefault(); openCart(); }
  });

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    buildDrawer();
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-show'); }, 2600);
  }

  /* ---------- cards ---------- */
  function cardHTML(p) {
    var meta = p.range === 'Shimmey' ? 'Shimmey Range' + (p.colorway ? ' &middot; ' + esc(p.colorway) : '') : p.range + ' &middot; ' + p.size;
    return '<article class="product-card">' +
      '<a class="product-card-media" href="product.html?slug=' + encodeURIComponent(p.slug) + '" aria-label="' + esc(p.name) + '">' +
      '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + ' timber lure" loading="lazy">' +
      '</a>' +
      '<div class="product-card-body">' +
      '<p class="product-meta">' + meta + '</p>' +
      '<h3><a href="product.html?slug=' + encodeURIComponent(p.slug) + '">' + esc(p.name) + '</a></h3>' +
      '<div class="product-card-foot"><span class="price">' + money(p.price) + '<small>AUD</small></span>' +
      '<button class="add-btn" type="button" data-add="' + esc(p.slug) + '">Add to list</button></div>' +
      '</div></article>';
  }
  function renderGrid(el, list) {
    if (!el) return;
    el.innerHTML = list.map(cardHTML).join('');
  }

  /* ---------- page: home ---------- */
  var featured = $('#featuredGrid');
  if (featured) {
    var wanted = ['natural-shimmey-number-1', 'shimmey-christmas-beetle', 'rtb-mover-125mm-number-2', 'rtb-mover-80mm-medium-diver-number-13', 'rtb-shaker-60mm-number-2', 'rtb-shaker-80mm-number-7', 'metallic-shimmey-number-3', 'rainbow-shimmey-number-2'];
    var picks = wanted.map(find).filter(Boolean);
    if (picks.length < 8) {
      PRODUCTS.forEach(function (p) { if (picks.length < 8 && picks.indexOf(p) === -1) picks.push(p); });
    }
    renderGrid(featured, picks.slice(0, 8));
  }

  /* ---------- page: shop ---------- */
  var shopGrid = $('#shopGrid');
  if (shopGrid) {
    var state = { range: 'all', sort: 'featured' };
    function apply() {
      var list = PRODUCTS.slice();
      if (state.range !== 'all') list = list.filter(function (p) { return p.range === state.range; });
      if (state.sort === 'price-asc') list.sort(function (a, b) { return a.price - b.price || a.name.localeCompare(b.name); });
      if (state.sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price || a.name.localeCompare(b.name); });
      if (state.sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
      renderGrid(shopGrid, list);
      var count = $('#shopCount');
      if (count) count.textContent = list.length + (list.length === 1 ? ' lure' : ' lures');
      $$('#shopFilters .filter').forEach(function (b) {
        var on = b.getAttribute('data-range') === state.range;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    $$('#shopFilters .filter').forEach(function (b) {
      b.addEventListener('click', function () { state.range = b.getAttribute('data-range'); apply(); history.replaceState(null, '', state.range === 'all' ? 'shop.html' : 'shop.html?range=' + state.range); });
    });
    var sort = $('#shopSort');
    if (sort) sort.addEventListener('change', function () { state.sort = sort.value; apply(); });
    var initial = new URLSearchParams(location.search).get('range');
    if (initial && ['Shaker', 'Mover', 'Shimmey'].indexOf(initial) !== -1) state.range = initial;
    apply();
  }

  /* ---------- page: product ---------- */
  var detail = $('#productDetail');
  if (detail) {
    var slug = new URLSearchParams(location.search).get('slug');
    var p = find(slug || '');
    if (!p) {
      detail.innerHTML = '<div class="prose"><h1>Lure not found</h1><p>That lure is not in the catalogue. <a href="shop.html">Back to the shop</a>.</p></div>';
    } else {
      document.title = p.name + ' | RTBroughton Lures';
      var meta = p.range === 'Shimmey'
        ? 'Shimmey Range' + (p.colorway ? ' &middot; ' + esc(p.colorway) : '') + ' &middot; Hand-finished timber'
        : p.range + ' Range &middot; ' + p.size + ' &middot; Hand-finished timber';
      var desc = p.range === 'Shimmey'
        ? 'A slim, hand-finished timber Shimmey in the ' + esc(p.name.replace(/^Shimmey Number \d+\s*/, '') || 'RTB') + ' colourway. Each lure is shaped, painted and finished by Ray in Queensland, so the grain and pattern on your lure will be its own.'
        : 'The ' + esc(p.range) + ' is Ray Broughton\u2019s ' + esc(p.size) + ' bibbed timber lure, shaped and finished by hand in Queensland.';
      if (p.range === 'Shimmey') {
        desc = 'A slim, hand-finished timber Shimmey' + (p.colorway ? ' in the ' + esc(p.colorway) + ' colourway' : '') + '. Each lure is shaped, painted and finished by Ray in Queensland, so the grain and pattern on your lure will be its own.';
      }
      detail.innerHTML =
        '<div class="product-figure" id="productFigure"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + ' timber lure"></div>' +
        '<div class="product-info">' +
        '<p class="crumbs"><a href="shop.html">Shop</a> / ' + esc(rangeLabel(p)) + '</p>' +
        '<h1>' + esc(p.name) + '</h1>' +
        '<p class="product-meta">' + meta + '</p>' +
        '<div class="product-price"><span class="price">' + money(p.price) + '</span><span>AUD</span></div>' +
        '<p>' + desc + '</p>' +
        '<div class="qty-row"><div class="qty"><button type="button" id="qtyMinus" aria-label="Decrease">&minus;</button>' +
        '<input id="qtyInput" type="number" min="1" max="99" value="1" aria-label="Quantity">' +
        '<button type="button" id="qtyPlus" aria-label="Increase">+</button></div>' +
        '<button class="btn" type="button" id="addToCart" style="flex:1">Add to list</button></div>' +
        '<div class="stock-note"><strong>One at a time.</strong><span>Each lure is made individually. Add yours to the list, then call or text Ray to confirm availability, postage and payment.</span></div>' +
        '</div>' +
        '<ul class="spec-list product-specs">' +
        '<li><span>Range</span><span>' + esc(p.range) + (p.size ? ' &middot; ' + esc(p.size) : '') + '</span></li>' +
        (p.number ? '<li><span>Number</span><span>' + p.number + '</span></li>' : '') +
        (p.colorway ? '<li><span>Colourway</span><span>' + esc(p.colorway) + '</span></li>' : '') +
        '<li><span>Material</span><span>Timber, hand-shaped and hand-finished</span></li>' +
        '<li><span>Hardware</span><span>Fitted with treble hooks</span></li>' +
        '<li><span>Made in</span><span>Queensland, Australia</span></li>' +
        '<li><span>Price</span><span>' + money(p.price) + ' AUD</span></li>' +
        '</ul>';
      var qty = $('#qtyInput');
      $('#qtyMinus').addEventListener('click', function () { qty.value = Math.max(1, Number(qty.value) - 1); });
      $('#qtyPlus').addEventListener('click', function () { qty.value = Math.min(99, Number(qty.value) + 1); });
      $('#addToCart').addEventListener('click', function () { addToCart(p.slug, Math.max(1, Math.min(99, Number(qty.value) || 1))); });
      var rel = $('#relatedGrid');
      if (rel) {
        var same = PRODUCTS.filter(function (x) { return x.range === p.range && x.slug !== p.slug; });
        renderGrid(rel, same.slice(0, 4));
      }
    }
  }

  /* ---------- contact form -> SMS ---------- */
  var cform = $('#contactForm');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#cfName').value.trim();
      var msg = $('#cfMessage').value.trim();
      var body = 'Hi Ray' + (name ? ', ' + name + ' here.' : '.') + ' ' + msg;
      window.location.href = 'sms:' + DATA.phone_link + '?body=' + encodeURIComponent(body);
    });
  }

  /* ---------- menu ---------- */
  var toggle = $('#menuToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var nav = $('#navLinks');
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  renderCart();
})();
