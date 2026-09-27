import type {
	IDataObject,
	JsonObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://api.sahifa.dev';

export class Sahifa implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Sahifa',
		name: 'sahifa',
		icon: 'file:../../icons/sahifa.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] === "pdf" ? "HTML to PDF" : "Screenshot"}}',
		description:
			'HTML or URL to PDF and screenshots, with Arabic and right-to-left support, rendered in Saudi Arabia',
		defaults: { name: 'Sahifa' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'sahifaApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Create PDF', value: 'pdf', action: 'Create a PDF from HTML or a URL', description: 'Render HTML or a web page to PDF' },
					{ name: 'Take Screenshot', value: 'screenshot', action: 'Take a screenshot of HTML or a URL', description: 'Render HTML or a web page to an image' },
				],
				default: 'pdf',
			},
			{
				displayName: 'Source',
				name: 'sourceType',
				type: 'options',
				options: [
					{ name: 'HTML', value: 'html' },
					{ name: 'URL', value: 'url' },
				],
				default: 'html',
			},
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				typeOptions: { rows: 8 },
				default: '',
				required: true,
				displayOptions: { show: { sourceType: ['html'] } },
				placeholder: '<html dir="rtl" lang="ar"><body><h1>فاتورة</h1></body></html>',
				description: 'The HTML to render. For Arabic, set dir="rtl" on the html element.',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { sourceType: ['url'] } },
				placeholder: 'https://example.com/invoice/123',
			},
			{
				displayName: 'Put Output File in Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'The name of the binary field the file is written to',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				placeholder: 'invoice.pdf',
				description: 'Optional. Defaults to document.pdf or screenshot.png.',
			},
			{
				displayName: 'PDF Options',
				name: 'pdfOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { operation: ['pdf'] } },
				options: [
					{ displayName: 'CSS', name: 'css', type: 'string', typeOptions: { rows: 3 }, default: '', description: 'Extra CSS injected before printing' },
					{ displayName: 'Delay (Ms)', name: 'delay', type: 'number', typeOptions: { minValue: 0, maxValue: 10000 }, default: 0, description: 'Milliseconds to wait before printing' },
					{
						displayName: 'Footer HTML',
						name: 'footer',
						type: 'string',
						typeOptions: { rows: 3 },
						default: '',
						description: 'HTML for the page footer. {{page}} and {{total}} are replaced with page numbers.',
					},
					{
						displayName: 'Format',
						name: 'format',
						type: 'options',
						options: ['A3', 'A4', 'A5', 'Letter', 'Legal', 'Tabloid'].map((f) => ({ name: f, value: f })),
						default: 'A4',
					},
					{
						displayName: 'Header HTML',
						name: 'header',
						type: 'string',
						typeOptions: { rows: 3 },
						default: '',
						description: 'HTML for the page header. {{page}} and {{total}} are replaced with page numbers.',
					},
					{ displayName: 'Landscape', name: 'landscape', type: 'boolean', default: false },
					{ displayName: 'Margin', name: 'margin', type: 'string', default: '', placeholder: '15mm', description: 'One value for all sides, e.g. 15mm' },
					{ displayName: 'Pages', name: 'pages', type: 'string', default: '', placeholder: '1-3,5' },
					{ displayName: 'Wait For', name: 'wait_for', type: 'string', default: '', description: 'CSS selector or function name to wait for before printing' },
				],
			},
			{
				displayName: 'Screenshot Options',
				name: 'screenshotOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { operation: ['screenshot'] } },
				options: [
					{ displayName: 'Block Ads', name: 'block_ads', type: 'boolean', default: false },
					{ displayName: 'Block Cookie Banners', name: 'block_cookie_banners', type: 'boolean', default: false },
					{ displayName: 'Dark Mode', name: 'dark_mode', type: 'boolean', default: false },
					{ displayName: 'Delay (Seconds)', name: 'delay', type: 'number', typeOptions: { minValue: 0, maxValue: 30 }, default: 0 },
					{ displayName: 'Device Scale Factor', name: 'device_scale_factor', type: 'number', typeOptions: { minValue: 0.1, maxValue: 4 }, default: 1 },
					{
						displayName: 'Format',
						name: 'format',
						type: 'options',
						options: [
							{ name: 'PNG', value: 'png' },
							{ name: 'JPEG', value: 'jpeg' },
							{ name: 'WebP', value: 'webp' },
							{ name: 'PDF', value: 'pdf' },
						],
						default: 'png',
					},
					{ displayName: 'Full Page', name: 'full_page', type: 'boolean', default: false },
					{ displayName: 'Selector', name: 'selector', type: 'string', default: '', description: 'Capture only the element matching this CSS selector' },
					{ displayName: 'Viewport Height', name: 'viewport_height', type: 'number', default: 800 },
					{ displayName: 'Viewport Width', name: 'viewport_width', type: 'number', default: 1280 },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const sourceType = this.getNodeParameter('sourceType', i) as string;
				const source = (sourceType === 'html' ? this.getNodeParameter('html', i) : this.getNodeParameter('url', i)) as string;
				if (!source) throw new NodeOperationError(this.getNode(), `The ${sourceType.toUpperCase()} is empty`, { itemIndex: i });
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
				let fileName = this.getNodeParameter('fileName', i, '') as string;

				let request: IHttpRequestOptions;
				let mimeType: string;
				if (operation === 'pdf') {
					const o = this.getNodeParameter('pdfOptions', i, {}) as IDataObject;
					const body: IDataObject = { source };
					for (const key of ['format', 'landscape', 'margin', 'css', 'delay', 'wait_for', 'pages']) {
						if (o[key] !== undefined && o[key] !== '') body[key] = o[key];
					}
					if (o.header) body.header = { source: o.header };
					if (o.footer) body.footer = { source: o.footer };
					request = { method: 'POST', url: `${BASE_URL}/v3/convert/pdf`, body, json: true };
					mimeType = 'application/pdf';
					fileName = fileName || 'document.pdf';
				} else {
					const o = this.getNodeParameter('screenshotOptions', i, {}) as IDataObject;
					const body: IDataObject = sourceType === 'html' ? { html: source } : { url: source };
					for (const [key, value] of Object.entries(o)) if (value !== '' && value !== undefined) body[key] = value;
					const format = (o.format as string) || 'png';
					request = { method: 'POST', url: `${BASE_URL}/take`, body, json: true };
					mimeType = format === 'pdf' ? 'application/pdf' : `image/${format}`;
					fileName = fileName || `screenshot.${format === 'jpeg' ? 'jpg' : format}`;
				}

				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'sahifaApi', {
					...request,
					encoding: 'arraybuffer',
					returnFullResponse: false,
				});
				const buffer = Buffer.from(response as ArrayBuffer);
				const binary = await this.helpers.prepareBinaryData(buffer, fileName, mimeType);

				returnData.push({
					json: { operation, fileName, mimeType, bytes: buffer.length },
					binary: { [binaryPropertyName]: binary },
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
