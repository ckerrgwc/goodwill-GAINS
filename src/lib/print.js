// Print a single element: everything else is hidden by the print stylesheet
// in index.css while body.printing is set.
export function printElement(el) {
  if (!el) return;
  el.classList.add('print-target');
  document.body.classList.add('printing');
  const cleanup = () => {
    el.classList.remove('print-target');
    document.body.classList.remove('printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  // Some browsers don't fire afterprint reliably.
  setTimeout(cleanup, 1000);
}
