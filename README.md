# n8n-nodes-sahifa

An [n8n](https://n8n.io) community node for [Sahifa](https://sahifa.dev/en/): turn HTML or a web page into a **PDF** or a **screenshot**, with **Arabic and right-to-left text** rendered correctly, processed **in Saudi Arabia**.

Typical workflows:

- New order in your shop → build an Arabic invoice from an HTML template → Sahifa → e-mail the PDF.
- Daily report → HTML table → Sahifa → upload the PDF to Google Drive or Slack.
- Monitor a page → Sahifa screenshot → post it to a channel.

## Installation

In n8n: **Settings → Community Nodes → Install**, then enter `n8n-nodes-sahifa`. See the [n8n guide to community nodes](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

1. Create a free account at [sahifa.dev](https://sahifa.dev/en/account): 100 renders a month, no card needed.
2. Copy your API key.
3. In n8n, create a **Sahifa API** credential and paste the key. The credential test renders a tiny image to check it.

## Operations

### Create PDF

- **Source**: HTML (for example from a previous node, with expressions) or a URL.
- **PDF Options**: format (A4, Letter, …), landscape, margin, header and footer HTML (`{{page}}` and `{{total}}` are replaced with page numbers), extra CSS, delay, wait for a selector, page ranges.
- Output: a binary file (`data` by default, `document.pdf`) that you can pass to e-mail, storage or messaging nodes.

### Take Screenshot

- **Source**: HTML or a URL.
- **Screenshot Options**: format (PNG, JPEG, WebP, PDF), full page, viewport size, device scale factor, a CSS selector to capture one element, dark mode, blocking ads and cookie banners, delay.
- Output: a binary image file.

## Arabic documents

Put `dir="rtl"` and `lang="ar"` on the `<html>` element, and wrap left-to-right parts such as IBANs, e-mails and amounts in `<bdi dir="ltr">…</bdi>`. Arabic fonts (Noto Naskh Arabic, Noto Sans Arabic, Amiri) are installed on the Sahifa servers.

```html
<html dir="rtl" lang="ar"><body style="font-family: 'Noto Naskh Arabic', serif">
  <h1>فاتورة ضريبية مبسطة</h1>
  <p>الإجمالي: <bdi dir="ltr">{{ $json.total }} SAR</bdi></p>
</body></html>
```

## Resources

- [Sahifa documentation](https://sahifa.dev/en/docs)
- [Examples in five languages](https://github.com/gyorgy-gulyas/sahifa-examples)
- Node.js client: [`sahifa` on npm](https://www.npmjs.com/package/sahifa)
- Support: [support@sahifa.dev](mailto:support@sahifa.dev)

## Compatibility

Built with the n8n node CLI and tested with n8n-workflow 2.x (n8n 1.x and later).

## Author

Gulyás György Tamás — [ggyt.hu](https://ggyt.hu/)

## License

MIT. Sahifa is a service of Yimello LLC.
