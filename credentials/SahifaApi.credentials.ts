import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SahifaApi implements ICredentialType {
	name = 'sahifaApi';

	displayName = 'Sahifa API';

	icon: Icon = 'file:../icons/sahifa.svg';

	documentationUrl = 'https://sahifa.dev/en/docs/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your Sahifa API key. Create a free one at https://sahifa.dev/en/account.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
				'X-Access-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	// A tiny render checks both that the key exists and that it is accepted.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.sahifa.dev',
			url: '/take',
			method: 'POST',
			body: { html: '<p>n8n</p>', format: 'png', viewport_width: 200, viewport_height: 100 },
			json: true,
		},
	};
}
