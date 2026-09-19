/* Shared allowlisted rendering for editor and readers. No executable HTML survives. */
window.SFArticle = (() => {
  const tags = new Set('P DIV SPAN H2 H3 H4 B STRONG I EM U UL OL LI BR BLOCKQUOTE FONT'.split(' '));
  const imagePrefix = 'https://kiavvxomyyvwuexjupdf.supabase.co/storage/v1/object/public/article-images/';
  function render(value) {
    let raw = String(value || '');
    const source = document.createElement('template');
    if (!/<\/?[a-z][^>]*>/i.test(raw)) {
      const escaped = document.createElement('div');
      escaped.textContent = raw;
      raw = escaped.innerHTML.split(/\r?\n/).map(line => {
        const clean = line.replace(/^[*_]+(?=#+)/, '').replace(/[*_]+$/, '');
        if (/^\s*#{2,3}\s*/.test(clean)) return '<h3>' + clean.replace(/^\s*#{2,3}\s*/, '') + '</h3>';
        return line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<u>$1</u>') + '<br>';
      }).join('');
    }
    source.innerHTML = raw;
    const output = document.createElement('div');
    function copy(node, parent) {
      if (node.nodeType === 3) { parent.append(document.createTextNode(node.textContent)); return; }
      if (node.nodeType !== 1) return;
      if (['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT'].includes(node.tagName)) return;
      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src') || '';
        if (!src.startsWith(imagePrefix) || !node.getAttribute('alt')?.trim()) return;
        const img = document.createElement('img');
        img.src = src; img.alt = node.getAttribute('alt'); img.loading = 'lazy';
        parent.append(img); return;
      }
      if (!tags.has(node.tagName)) { [...node.childNodes].forEach(child => copy(child,parent)); return; }
      const el = document.createElement(node.tagName === 'FONT' ? 'span' : node.tagName.toLowerCase());
      if (node.tagName === 'BLOCKQUOTE' && ['warning','note'].includes(node.getAttribute('data-callout')))
        el.setAttribute('data-callout', node.getAttribute('data-callout'));
      const color = node.getAttribute('color') || node.style.color;
      if (/^(#[a-f0-9]{3,8}|rgba?\([\d.,%\s]+\)|[a-z]+)$/i.test(color || '')) {
        el.style.color = color;
        // Replace the old fuchsia heading preset; other custom colours remain editable.
        if (node.closest('h2,h3,h4') && ['rgb(244, 98, 161)', 'rgb(255, 0, 255)'].includes(el.style.color))
          el.style.color = '#803550';
      }
      const sizes = {1:'12px',2:'14px',3:'16px',4:'18px',5:'24px',6:'30px',7:'36px'};
      const size = sizes[node.getAttribute('size')] || node.style.fontSize;
      if (/^(1[2-9]|2[0-9]|3[0-6])px$/.test(size || '')) el.style.fontSize = size;
      if (['bold','600','700'].includes(node.style.fontWeight)) el.style.fontWeight = '700';
      if (node.style.fontStyle === 'italic') el.style.fontStyle = 'italic';
      if (node.style.textDecoration.includes('underline')) el.style.textDecoration = 'underline';
      [...node.childNodes].forEach(child => copy(child,el)); parent.append(el);
    }
    [...source.content.childNodes].forEach(node => copy(node,output));
    return output.innerHTML;
  }
  function text(value) { const el=document.createElement('div'); el.innerHTML=render(value); return el.textContent; }
  return { render, text };
})();
