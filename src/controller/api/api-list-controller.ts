import { ApiPromise } from '@polkadot/api';
import fs from 'fs';
import path from 'path';
import HTTPMethod from 'http-method-enum';
import { Next, Request, Response } from 'restify';
import type { StorageEntry } from '@polkadot/types/primitive/types';
import { unwrapStorageType } from '@polkadot/types/primitive/StorageKey';
import { getSiName } from '@polkadot/types/metadata/util';
import swaggerTpl from '../../swagger_tmplate';
import _ from 'lodash';

import { Endpoint, IGroupableController } from '../model';

export class ApiListController implements IGroupableController {
	constructor(private readonly _api: ApiPromise) { }
	getApiList = (async () => {
		try {
			await this._api.isReady;
			const api = this._api;

			const arr = Object
				.keys(api.query)
				.sort()
				.filter((name): number => Object.keys(api.query[name]).length)
				.map((t): any => {

					const section = api.query[t];

					if (!section || Object.keys(section).length === 0) {
						return [];
					}
					let childrens = Object
						.keys(section)
						.sort()
						.map((value): any => {
							const { meta: { docs, modifier, name, type } } = section[value] as unknown as StorageEntry;
							const output = unwrapStorageType(api.registry, type, modifier.isOptional);
							let input = '', params = [];

							if (type.isMap) {
								const { hashers, key } = type.asMap;
								if (hashers.length === 1) {
									input = getSiName(api.registry.lookup, key);
									params.push(input);
								} else {
									const si = api.registry.lookup.getSiType(key).def;

									if (si.isTuple) {
										let arr2 = si.asTuple
											.map((t) => getSiName(api.registry.lookup, t));
										input = arr2.join(', ');
										params.push(...arr2);
									} else {
										input = si.asHistoricMetaCompat.toString();
										params.push(input);
									}
								}
							}
							let fullPath = '/' + t + '/' + value;
							if (params.length) {
								fullPath += '/' + params.map(p=>'{'+p+'}').join('/');
							}
							let obj = {
								path: value,
								fullPath: fullPath,
								method: t + '.' + value + '(' + input + '):' + output,
								paramLength: params.length,
								params: params,
								tips: (docs[0] || name).toString()

							};
							return obj;

							// return t + '/' + value + '(' + input + '):' + output + '//' + (docs[0] || name).toString()
						});
					return {
						path: t,
						childrens
					}

				});

			return arr;
		} catch (err) {
			return []
		}
	});
	makeSwagger = (async (req: Request, res: Response, next: Next) => {
		let list = await this.getApiList();
		let paths: any = {};
		list.forEach((t: any) => {
			swaggerTpl.tags.push({ name: t.path });
			t.childrens.forEach((c: any) => {
				paths[c.fullPath] = {
					'get': {
						"tags": [
							t.path
						],
						"summary": c.tips,
						"description": "",
						"operationId": c.path,
						"consumes": [
							"application/json"
						],
						"produces": [
							"application/json"
						],
						"parameters": c.params.map((p: any) => {
							return {
								in: 'path', name: p, required: true
							}
						}),
						"responses": {
							"200": {
								"description": "successful operation",
								"schema": {
									"$ref": "#/definitions/ApiResponse"
								}
							},
						}
					}
				};
			})
		});
		swaggerTpl.tags.shift();
		swaggerTpl.paths = paths;
		let jsonStr = JSON.stringify(swaggerTpl);
		fs.writeFileSync(path.join(__dirname, '../../../docs/a.json'), jsonStr);
		res.send(200, 'ok');
		next();
	});
	handleAllAPI = async (req: Request, res: Response, next: Next) => {
		let list = await this.getApiList();
		res.send(200, list);
		next();
	};
	handleCallAPI = async (req: Request, res: Response, next: Next) => {
		try {
			console.log(req.params);
			let path = req.params.path;
			let arr = req.params['*'].split('/');
			if (!req.params['*'] || arr.length == 0) {
				return res.send(500,{ code: '500', msg: 'param error' });
			}
			let action = arr[0];
			arr.shift();

			let retsult;
			let fun = this._api.query[path][action];
			if (fun.entries && typeof fun.entries == 'function') {
				retsult = await fun.entries();
				retsult = retsult.map(([key, entry]) => {
					let id = _.get(key.args.map((k) => k.toHuman()), `0`);
					let humanObj = entry.toJSON();
					return _.assign(humanObj, { key: id });
				});
			}
			else if (arr.length > 0) {
				retsult = await fun(...arr);
				retsult = retsult.toJSON();
			}
			else {
				retsult = await fun();
				retsult = retsult.toJSON();
			}

			res.send(200, { code: 200, msg: 'ok', data: retsult });
			next();
		} catch (err) {
			console.error(err);
			next(err);
		}
	};

	prefix = '/api';
	endpoints = [
		new Endpoint(HTTPMethod.GET, '/all', [this.handleAllAPI]),
		new Endpoint(HTTPMethod.GET, '/call/:path/*', [this.handleCallAPI]),
		new Endpoint(HTTPMethod.GET, '/doc', [this.makeSwagger])
	];
}