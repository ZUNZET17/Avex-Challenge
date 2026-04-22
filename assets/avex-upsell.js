class AvexUpsellComponent extends HTMLElement {
  #boundRefresh = this.refresh.bind(this);
  #boundHandleCartUpdate = this.#handleCartUpdate.bind(this);
  #boundHandleClick = this.#handleClick.bind(this);
  #cartDrawer = null;

  connectedCallback() {
    console.log('AvexUpsellComponent connected');
    this.#cartDrawer = document.querySelector('cart-drawer-component');
    this.#cartDrawer?.addEventListener('dialog:open', this.#boundRefresh);
    document.addEventListener('cart:update', this.#boundHandleCartUpdate);
    document.addEventListener('click', this.#boundHandleClick);
  }

  disconnectedCallback() {
    this.#cartDrawer?.removeEventListener('dialog:open', this.#boundRefresh);
    document.removeEventListener('cart:update', this.#boundHandleCartUpdate);
    document.removeEventListener('click', this.#boundHandleClick);
  }

  async refresh() {
    this.innerHTML = '<p class="cart-upsell__loading">Loading products...</p>';

    const cart = await fetch('/cart.js').then((r) => r.json());

    if (!cart.items.length) {
      this.innerHTML = '';
      return;
    }

    const productId = cart.items[0].product_id;
    const url = `${this.dataset.recommendationsUrl}&product_id=${productId}&section_id=${this.dataset.sectionId}&intent=related`;
    const html = await fetch(url).then((r) => r.text());

    const doc = document.createElement('div');
    doc.innerHTML = html;
    const freshUpsell = doc.querySelector('avex-upsell');

    if (freshUpsell) this.innerHTML = freshUpsell.innerHTML;
  }

  #handleCartUpdate(event) {
    if (event.detail?.data?.source === 'cart-upsell') return;
    setTimeout(this.#boundRefresh, 300);
  }

  async #handleClick(event) {
    const btn = event.target.closest('.cart-upsell__add-btn');
    if (!btn || !this.contains(btn)) return;

    btn.disabled = true;
    btn.textContent = '...';

    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: Number(btn.dataset.variantId), quantity: 1 }] }),
    });

    document.dispatchEvent(new CustomEvent('cart:update', {
      bubbles: true,
      detail: { data: { source: 'cart-upsell' } },
    }));
  }
}

if (!customElements.get('avex-upsell')) {
  customElements.define('avex-upsell', AvexUpsellComponent);
}
