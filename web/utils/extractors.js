
// This script is meant to be executed inside the Google Search results page within a webview.
// It extracts search results and sends them back to the host application.
// NOTE: Google's DOM structure changes frequently. This is a best-effort implementation
// and may need updates. It includes multiple selectors as fallbacks.

function extractGoogleResults() {
  const results = [];
  // Try a few common selectors for Google's result containers
  const resultContainers = document.querySelectorAll('div.g, div.xpd, div.MjjYud, div[data-hveid]');

  if (!resultContainers.length) {
    return [];
  }

  resultContainers.forEach(container => {
    if (results.length >= 8) return; // Limit to 8 results

    try {
      const linkEl = container.querySelector('a[href]');
      const titleEl = container.querySelector('h3');

      // Skip if it's not a main result (e.g., "People also ask")
      if (!linkEl || !titleEl || !linkEl.href.startsWith('http')) {
        return;
      }

      // Find snippet with multiple potential selectors
      const snippetEl =
        container.querySelector('.VwiC3b, .IsZvec, .MUxGbd, .vIgdZd, .s3v9rd, .GI742c') ||
        (container.lastChild)?.querySelector('div[style="-webkit-line-clamp:2"]');

      const title = titleEl.innerText;
      const link = linkEl.href;
      const snippet = snippetEl ? snippetEl.innerText : '';

      let domain = '';
      try {
        domain = new URL(link).hostname.replace('www.', '');
      } catch (e) {
        domain = link.split('/')[2] || '';
      }

      // Ensure we don't add duplicates
      if (title && link && !results.some(r => r.link === link)) {
        results.push({
          title,
          snippet,
          link,
          domain,
        });
      }
    } catch (e) {
      // Ignore errors for individual result items
      console.warn('Could not parse a search result item.', e);
    }
  });

  return results;
}
