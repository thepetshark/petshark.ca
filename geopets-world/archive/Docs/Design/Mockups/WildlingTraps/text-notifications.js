'use strict';

// Browser presentation study. Uses elapsed UI time, independent of gameplay fixture time.
class TextNotificationStack {
  constructor(root, clock = () => performance.now()) {
    this.root = root;
    this.clock = clock;
    this.rows = [];
    this.frame = 0;
  }

  post(text, {color = '#ffffff', bold = false} = {}) {
    if (!text || !text.trim()) return;
    const time = this.clock();
    this.update(time);
    for (const row of this.rows) {
      // Set once, never multiply, and never interrupt a fade already in progress.
      if (time - row.created < 1000) row.holdOpacity = .5;
    }
    const element = document.createElement('div');
    element.className = 'text-notice';
    element.textContent = text;
    element.style.color = color;
    element.style.fontWeight = bold ? '900' : '600';
    this.root.append(element);
    this.rows.push({element, created: time, holdOpacity: 1});
    while (this.rows.length > 3) this.rows.shift().element.remove();
    this.update(time);
    this.schedule();
  }

  update(time = this.clock()) {
    this.rows = this.rows.filter(row => {
      if (time - row.created < 1500) return true;
      row.element.remove();
      return false;
    });
    let offset = 0;
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const row = this.rows[i];
      const fade = Math.max(0, Math.min(1, (time - row.created - 1000) / 500));
      row.element.style.opacity = row.holdOpacity * (1 - fade);
      row.element.style.transform = `translateY(-${offset}px)`;
      offset += row.element.offsetHeight + 7;
    }
  }

  schedule() {
    if (this.frame || !this.rows.length) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
      this.schedule();
    });
  }

  clear() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.rows.forEach(row => row.element.remove());
    this.rows = [];
  }
}
