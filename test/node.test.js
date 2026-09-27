// Runs the compiled node against a minimal fake of n8n's execution context.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Sahifa } = require('../dist/nodes/Sahifa/Sahifa.node.js');

function context(params, { fail = false } = {}) {
	const calls = [];
	const ctx = {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name, _i, fallback) => (name in params ? params[name] : fallback),
		getNode: () => ({ name: 'Sahifa', type: 'n8n-nodes-sahifa.sahifa', typeVersion: 1, parameters: {} }),
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (credential, options) => {
				calls.push({ credential, options });
				if (fail) throw Object.assign(new Error('Monthly render allowance used up'), { httpCode: '402' });
				return new TextEncoder().encode('%PDF-1.7').buffer;
			},
			prepareBinaryData: async (buffer, fileName, mimeType) => ({ data: buffer.toString('base64'), fileName, mimeType }),
		},
	};
	return { ctx, calls };
}

test('Create PDF sends the HTML and options to /v3/convert/pdf and returns a binary file', async () => {
	const { ctx, calls } = context({
		operation: 'pdf', sourceType: 'html', html: '<h1 dir="rtl">فاتورة</h1>', binaryPropertyName: 'data', fileName: '',
		pdfOptions: { format: 'A4', margin: '15mm', footer: '<div>{{page}}</div>', delay: 0 },
	});
	const [[out]] = await new Sahifa().execute.call(ctx);
	assert.equal(calls[0].credential, 'sahifaApi');
	assert.equal(calls[0].options.url, 'https://api.sahifa.dev/v3/convert/pdf');
	assert.equal(calls[0].options.encoding, 'arraybuffer');
	assert.deepEqual(calls[0].options.body, { source: '<h1 dir="rtl">فاتورة</h1>', format: 'A4', margin: '15mm', delay: 0, footer: { source: '<div>{{page}}</div>' } });
	assert.equal(out.binary.data.fileName, 'document.pdf');
	assert.equal(out.binary.data.mimeType, 'application/pdf');
	assert.equal(out.json.bytes, 8);
});

test('Take Screenshot of a URL sends url and options to /take', async () => {
	const { ctx, calls } = context({
		operation: 'screenshot', sourceType: 'url', url: 'https://example.com', binaryPropertyName: 'shot', fileName: '',
		screenshotOptions: { format: 'jpeg', full_page: true },
	});
	const [[out]] = await new Sahifa().execute.call(ctx);
	assert.equal(calls[0].options.url, 'https://api.sahifa.dev/take');
	assert.deepEqual(calls[0].options.body, { url: 'https://example.com', format: 'jpeg', full_page: true });
	assert.equal(out.binary.shot.fileName, 'screenshot.jpg');
	assert.equal(out.binary.shot.mimeType, 'image/jpeg');
});

test('an empty source and API errors become n8n errors', async () => {
	const empty = context({ operation: 'pdf', sourceType: 'html', html: '', pdfOptions: {} });
	await assert.rejects(new Sahifa().execute.call(empty.ctx), /HTML is empty/);
	const failing = context({ operation: 'pdf', sourceType: 'html', html: '<p>x</p>', pdfOptions: {} }, { fail: true });
	await assert.rejects(new Sahifa().execute.call(failing.ctx), (err) => err.constructor.name === 'NodeApiError');
});
