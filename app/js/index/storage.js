/**
 * 本地存储
 * localStorage
 * use:
 * 
 * util.js
 *
 */

(function(win, $) {
	'use strict';

	const LOCAL_STORAGE_NAME = 'Collect@';  //本地数据localStorage键名
	const TAB_STORAGE_NAME = 'Collect@tab';  //本地数据localStorage键名

	var Storage = function() {
		//接口数据存储
		this._db = null;	//内存中的文库缓存
		this.syncLocalStorage('read');

		//tab数据存储
		this._tab = null;
		this.syncTabStorage('read');
	};
	
	//同步本地存储中的内容
	Storage.prototype.syncLocalStorage = function(type) {
		if(type == 'read') {
			const defaultStr = '{"collection":[]}';
			this._db = JSON.parse(win.localStorage[LOCAL_STORAGE_NAME] || defaultStr);

		} else if( type == "save") {
			win.localStorage[LOCAL_STORAGE_NAME] = JSON.stringify(this._db);

			renderLeftMenu(this._db.collection);

		}
	};

	//创建项目
	Storage.prototype.addProject =  function(opt) {
		if(!!opt && typeof opt == 'object') {

			var parentId = Util.guid(),
				_name = opt.name,
				_description = opt.description;

			this._db.collection.push({
				"variables":[],
				"info": {
					"name": _name,
					"_apiflow_id": parentId,
					"description": _description,
					"schema": "https://schema.getpostman.com/json/collection/v2.0.0/collection.json"
				},
				"item": []
			});

			this.syncLocalStorage('save');
		}
		
	};

	Storage.prototype.readAll = function(opt) {
		return this._db.collection;
	};

	/**
	 * [addFolder 新增文件夹]
	 * @param {[type]} opt [description]
	 *   {
	 * 		name: 名称
	 *   	description: 描述
	 *    	site: 位置
	 *   }
	 */
	Storage.prototype.addFolder = function(opt) {
		if(!!opt && typeof opt == 'object') {

			const _name = opt.name,
				_description = opt.description,
				_site = opt.site;

			

			this.setItem(_site, {
				"name": _name,
				"description": _description,
				"item": []
			})

			this.syncLocalStorage('save');
		}
	};

	/**
	 * [addApi 新增文件夹]
	 * @param {[type]} opt [description]
	 *   {
	 * 		name: 名称
	 *   	description: 描述
	 *   	url: url,
			method: method,
			header: opt.[]
			bod: body,
			response: response
	 *    	site: 位置
	 *   }
	 */
	Storage.prototype.saveApi = function(opt,callback) {
		console.log(opt)
		if(!!opt && typeof opt == 'object') {

			const _hasExit = opt.hasExit,
				_apiSite = opt.apiSite,
				_name = opt.name,
				_description = opt.description||'',
				_url = opt.url||'',
				_method = opt.method||'',
				_header = opt.header||[],
				_body= opt.body||'',
				_response = opt.response||[],
				_site = opt.site;

			if(_hasExit) {
				//已经存在接口，则替换
				this.editApi(_site, _apiSite, {
					"name": _name,
					"request": {
						"url": _url,
						"method": _method,
						"header": _header,
						"body": _body,
						"description": _description
					},
					"response": _response
				});

			} else {
				//不存在接口或者文件夹，则插入
				this.setItem(_site, {
					"name": _name,
					"request": {
						"url": _url,
						"method": _method,
						"header": _header,
						"body": _body,
						"description": _description
					},
					"response": _response
				}, function(res) {
					//_ 后面表示第几个，为数组下标
					const newSite = _site + '_' + res;

					if(typeof callback == 'function') {
						callback(newSite);
					}

				});
			}
			

			this.syncLocalStorage('save');
		}
	};

	//写入文件夹或者api接口
	Storage.prototype.setItem = function(site, info,callback) {
		const _arr = this.getApiSite(site);

		//插入
		_arr.push(info);
		//替换
		
		if(typeof callback == 'function') {
			//返回生成的文件或者文件夹下标
			callback(_arr.length-1);
		}
	};

	//编辑替换api接口
	Storage.prototype.editApi = function(site, apiSite, info) {
		console.log(site);

		const _arr = this.getApiSite(site);

		//替换
		_arr.splice(apiSite,1,info);
	};


	//获取文件夹或者api的父级数组
	Storage.prototype.getApiSite = function(site) {
		const _arr = site.toString().split('-'),
			len = _arr.length;

		let newArr = [];

		//如果是第一级
		if(len == 1) {
			newArr = this._db.collection[site].item;
		} else {
			
			const getArr = (collection,i) => {
				i = i ? i : 0;
				if(i < len) {
					collection = collection[_arr[i]];
					i++;
					return getArr(collection.item, i);
				} else {
					return collection;
				}
			};
			
			newArr = getArr(this._db.collection);
		}

		return newArr;
	};


	//读取接口信息
	Storage.prototype.readItem = function(site){
		if(site != 'undefined' && site.indexOf('add') < 0 ) {
			const folderSite = site.split('_')[0],
				apiSite = site.split('_')[1];

			const _arr = this.getApiSite(folderSite);

			return _arr[apiSite];

		} else {
			return {
				name: '',
	            request: {
	                description: '',
	                header:[],
	                method: 'GET',
	                url: '',
	                body:{

	                }
	            }
			}
		}
	}

	//删除某个接口
	Storage.prototype.removeItem = function(site,callback){
		
		console.log(site);
		site += '';

		if(site) {
			const folderSite = site.split('_')[0],
				apiSite = site.split('_')[1],
				hasExit = site.indexOf('_') > -1 ? true : false;

			if(hasExit) {
				//接口
				const _arr = this.getApiSite(folderSite);
				//删除
				_arr.splice(apiSite,1);
			} else {
				//文件夹
				const lastsplit = folderSite.lastIndexOf('-');

				if(folderSite.indexOf('-') > -1) {

					const siteStr = folderSite.substring(0,lastsplit);
					const lastSite = folderSite.substr(lastsplit+1,1);

					//删除文件夹
					const _folderArr = this.getApiSite(siteStr);
					_folderArr.splice(lastSite,1);
				} else {
					//只有一层，则直接删除
					this._db.collection.splice(folderSite,1);
				}
				
				
			}

			this.syncLocalStorage('save');

			if(typeof callback == 'function') {
				callback();
			}

		} else {
			console.log('site '+site +' 不存在');
			return 0;
		}	
	}

	//读取所有的数据
	Storage.prototype.fetchAllMenu = function() {
		this.syncLocalStorage('read');
		return this._db;
	};


/////////////////////////下面为存储tab标签
///
///
///[
///	{
///		psite: 0,	//最外层父文件夹
///		site: 0-1-1_1,	//节点
///		name: name,	
///		active: true	是否是激活状态
///	},
///	{
///		psite:1,
///		site:1-0-0-1_0,
///		name: name,
///		active: true
///	}
///]
///
///
///

	Storage.prototype.syncTabStorage = function(type) {
		if(type == 'read') {
			const defaultStr = '[{"active": "true","name": "新接口","psite": "add","site": "add"}]';
			
			this._tab = JSON.parse(win.localStorage[TAB_STORAGE_NAME] || defaultStr);

		} else if( type == "save") {
			win.localStorage[TAB_STORAGE_NAME] = JSON.stringify(this._tab);

			//renderLeftMenu(this._tab);
		}
	};

	//返回所有的tab
	Storage.prototype.readTabAll = function() {
		return this._tab;
	};

	//保存tab
	Storage.prototype.saveTab = function(name,site) {

		site += '';
		const parentFolder =  site.substring(0,1);
		let tabArr = [],
			len =  this._tab.length;

		for(let i = 0; i < len; i++ ) {
			this._tab[i].active = false;
			tabArr.push(this._tab[i].psite);
		}
		
		const pIndex = tabArr.indexOf(parentFolder);

		//如果存在该接口对应的最外层父接口，则替换
		if( pIndex > -1) {
			this._tab[pIndex].site = site;
			this._tab[pIndex].name = name;
			this._tab[pIndex].active = true;
		} else {
			this._tab.push({
				active: true,
				name: name,
				psite: parentFolder,
				site: site
			});
		}

		this.syncTabStorage('save');

	};

	//新增tab
	//新增的site和psite为add
	Storage.prototype.addTab = function() {
		let len =  this._tab.length,
			addNum = 0;

		for(let i = 0; i < len; i++ ) {
			this._tab[i].active = false;
			if(this._tab[i].site.indexOf('add') > -1) {
				addNum ++;
			}
		}

		this._tab.push({
			active: true,
			name: '新接口' + (addNum||''),
			psite: 'add' + (addNum||''),
			site: 'add' + (addNum||'')
		});

		this.syncTabStorage('save');
	};

	Storage.prototype.removeTab = function(site) {
		let parentFolder = '';

		if(site.indexOf('add') > -1) {
			//表示是新增的tab
			parentFolder = site;
		} else {
			site += '';
			parentFolder =  site.substring(0,1);
		}

		let tabArr = [],
			len =  this._tab.length;

		for(let i = 0; i < len; i++ ) {
			this._tab[i].active = false;
			tabArr.push(this._tab[i].psite);
		}
		
		const pIndex = tabArr.indexOf(parentFolder);

		//删除
		
		
		this._tab.splice(pIndex,1);
		this._tab[len-2].active = true;
		this.syncTabStorage('save');	
	};

	
	return win.ApiStorage = Storage;
})(window, jQuery);
