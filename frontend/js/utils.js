// Converteix caràcters especials per poder inserir text dins d'HTML.
export const escapeHtml = (value) => {
  const symbols = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return String(value ?? '').replace(/[&<>"']/g, (char) => symbols[char]);
};
