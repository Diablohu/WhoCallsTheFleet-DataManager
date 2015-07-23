"use strict";

// node.js modules
	node.require('fs')
	node.require('nedb')
	node.require('path')
	node.require('mkdirp')
	node.require('cwebp')
	node.require('semver')
	node.require('url')

	var Q 			= node.require('q')
		,request 	= node.require('request')
		,jf 		= require('jsonfile')

var server_ip 	= '203.104.209.23'
	//,proxy 		= 'http://127.0.0.1:8087'
	,proxy 		= 'http://127.0.0.1:8118'

	,_comp = {}





// Global Variables
	_g.inputIndex = 0;
	_g.animate_duration_delay = 320;
	_g.execPath = node.path.dirname(process.execPath)

	_g.path = {
		'db': 		process.cwd() + '/data/',
		'fetched': {
			'ships': 	process.cwd() + '/fetched_data/ships/',
			'items': 	process.cwd() + '/fetched_data/items/'
		},
		'pics': {
			'ships': 	process.cwd() + '/pics/ships/',
			'items': 	process.cwd() + '/pics/items/'
		}
	}

	_g.pathMakeObj = function(obj){
		for( var i in obj ){
			if( typeof obj[i] == 'object' ){
				_g.pathMakeObj( obj[i] )
			}else{
				node.mkdirp.sync( obj[i] )
			}
		}
	}
	_g.pathMakeObj( _g.path )

	_g.data = {
		'entities': {},

		'items': {},
		'item_types': {},

		'ships': {},
		'ship_id_by_type': [], 			// refer to _g.ship_type_order
		'ship_types': {},
		'ship_type_order': {},
		'ship_classes': {}
	}

	var _db = {
	}
	_g.ship_type_order = []
	_g.ship_type_order_map = {}
	_g.ship_type_order_name = []

	_g.newInputIndex = function(){
		_g.inputIndex++
		return '_input_g' + (_g.inputIndex - 1)
	}















// Global Functions
	_g.statSpeed = {
		5: 	'低速',
		10: '高速'
	}
	_g.statRange = {
		1: 	'短',
		2: 	'中',
		3: 	'长',
		4: 	'超长'
	}
	_g.getStatSpeed = function( speed ){
		speed = parseInt(speed)
		return _g.statSpeed[speed]
	}
	_g.getStatRange = function( range ){
		range = parseInt(range)
		return _g.statRange[range]
	}
	_g.log = function( msg ){
		console.log(msg)
		try{_log(msg)}
		catch(e){}
	}
















// Global Frame
_frame.app_main = {
	page: {},
	page_dom: {},

	// is_init: false
	bgimg_dir: 	'./app/assets/images/homebg',
	bgimgs: 	[],
	// cur_bgimg_el: null

	// cur_page: null

	// 尚未载入完毕的内容
		loading: [
			'dbs',
			'bgimgs',
			'db_namesuffix'
		],
		// is_loaded: false,

	// 载入完毕一项内容，并检查其余内容是否载入完毕
	// 如果全部载入完毕，#layout 添加 .ready
		loaded: function( item ){
			_frame.app_main.loading.splice(_frame.app_main.loading.indexOf(item), 1)
			if( !_frame.app_main.loading.length && !_frame.app_main.is_loaded ){
				setTimeout(function(){
					_frame.dom.layout.addClass('ready')
				}, 1000)
				// 绑定onhashchange事件
					$(window).on('hashchange.pagechange', function(){
						_frame.app_main.load_page_func(_g.uriHash('page'))
					})

				_frame.app_main.load_page_func(_g.uriHash('page'))
				_frame.app_main.is_loaded = true
			}
		},


	// 更换背景图
		change_bgimg: function(){
			// _frame.app_main.bgimgs 未生成，函数不予执行
			if( !_frame.app_main.bgimgs.length )
				return false

			var img_new = _frame.app_main.bgimgs[_g.randInt(_frame.app_main.bgimgs.length - 1)]
				,img_old = _frame.app_main.cur_bgimg_el ? _frame.app_main.cur_bgimg_el.css('background-image') : null

			img_old = img_old ? img_old.split('/') : null
			img_old = img_old ? img_old[img_old.length - 1].split(')') : null
			img_old = img_old ? img_old[0] : null

			while( img_new == img_old ){
				img_new = _frame.app_main.bgimgs[_g.randInt(_frame.app_main.bgimgs.length - 1)]
			}

			img_new = '.' + _frame.app_main.bgimg_dir + '/' + img_new

			function delete_old_dom( old_dom ){
				setTimeout(function(){
					old_dom.remove()
				}, _g.animate_duration_delay)
			}

			if( img_old ){
				delete_old_dom( _frame.app_main.cur_bgimg_el )
			}

			//_frame.app_main.cur_bgimg_el = $('<img src="' + img_new + '" />').appendTo( _frame.dom.bgimg )
			_frame.app_main.cur_bgimg_el = $('<div/>').css('background-image','url('+img_new+')').appendTo( _frame.dom.bgimg )
		},





	// 隐藏内容，只显示背景图
		toggle_hidecontent: function(){
			_frame.dom.layout.toggleClass('hidecontent')
		},





	// 更换页面
		load_page: function( page ){
			_g.uriHash('page', page)
		},
		load_page_func: function( page ){
			if( _frame.app_main.cur_page == page || !page )
				return page

			if( !_frame.app_main.page_dom[page] ){
				_frame.app_main.page_dom[page] = $('<div class="page" page="'+page+'"/>').appendTo( _frame.dom.main )
				node.fs.readFile('./app/page/' + page + '.html', 'utf8', function(err, data){
					if(err)
						throw err
					_frame.app_main.page_dom[page].html( data )
					if( _frame.app_main.page[page] && _frame.app_main.page[page].init )
						_frame.app_main.page[page].init(_frame.app_main.page_dom[page])
					_p.initDOM(_frame.app_main.page_dom[page])
				})
			}

			_frame.app_main.page_dom[page].removeClass('off')

			// 关闭之前的页面
				if( _frame.app_main.cur_page ){
					_frame.dom.navs[_frame.app_main.cur_page].removeClass('on')
					_frame.app_main.page_dom[_frame.app_main.cur_page].addClass('off')
				}

			_frame.dom.navs[page].addClass('on')

			if( _frame.dom.layout.hasClass('ready') )
				_frame.app_main.change_bgimg()

			_frame.app_main.cur_page = page
		},






	init: function(){
		if( _frame.app_main.is_init )
			return true

		// 创建基础框架
			_frame.dom.aside = $('<aside/>').appendTo( _frame.dom.layout )
				_frame.dom.logo = $('<button class="logo" />').on('click', function(){
										_frame.app_main.toggle_hidecontent()
									})
									.html('<strong>' + node.gui.App.manifest['name'] + '</strong><b>' + node.gui.App.manifest['name'] + '</b>')
									.on({
										'animationend, webkitAnimationEnd': function(e){
											$(this).addClass('ready-animated')
										}
									})
									.appendTo( _frame.dom.aside )
				_frame.dom.nav = $('<nav/>').appendTo( _frame.dom.aside )
			_frame.dom.main = $('<main/>').appendTo( _frame.dom.layout )
			_frame.dom.bgimg = $('<div class="bgimg" />').appendTo( _frame.dom.layout )

		// 创建左侧主导航菜单
			function navLink(page){
				return $('<button />').on('click', function(){
						_frame.app_main.load_page(page)
					})
			}
			if( _frame.app_main.nav && _frame.app_main.nav.length ){
				_frame.dom.navs = {}
				for( var i in _frame.app_main.nav ){
					var o = _frame.app_main.nav[i]
					_frame.dom.navs[o.page] = navLink(o.page).html(o.title).appendTo( _frame.dom.nav )
					if( i == 0 && !_g.uriHash('page') ){
						_frame.dom.navs[o.page].trigger('click')
					}
				}
			}

		// 获取背景图列表，生成背景图
			node.fs.readdir(_frame.app_main.bgimg_dir, function(err, files){
				for( var i in files ){
					_frame.app_main.bgimgs.push( files[i] )
				}
				_frame.app_main.change_bgimg();
				_frame.app_main.loaded('bgimgs')
				//if( !_g.uriHash('page') )
				//	_frame.app_main.load_page( _frame.app_main.nav[0].page )
				//setTimeout(function(){
				//	_frame.dom.layout.addClass('ready')
				//}, 1000)
			})

		// 部分全局事件委托
			$('html').on('click.openShipModal', '[data-shipid]', function(){
				if( $(this).data('shipmodal') == 'false' )
					return false
				if( $(this).data('shipedit') ){
					//try{
						_frame.app_main.page['ships'].show_ship_form( _g.data.ships[ $(this).data('shipid') ] )
					//}catch(e){console.log(e)}
				}else{
					try{
						_frame.app_main.show_ship( _g.data.ships[ $(this).data('shipid') ] )
					}catch(e){console.log(e)}
				}
			}).on('click.openItemModal', '[data-itemid]', function(){
				if( $(this).data('itemmodal') == 'false' )
					return false
				if( $(this).data('itemedit') ){
					//try{
						_frame.app_main.page['items'].show_item_form( _g.data.items[ $(this).data('itemid') ] )
					//}catch(e){console.log(e)}
				}else{
					try{
						_frame.app_main.show_item( _g.data.items[ $(this).data('itemid') ] )
					}catch(e){console.log(e)}
				}
			})

		var promise_chain 	= Q.fcall(function(){})

		// 开始异步函数链
			promise_chain

		// 检查 aap-db 目录，预加载全部数据库
			.then(function(){
				var deferred = Q.defer()
				node.fs.readdir(_g.path.db, function(err, files){
					if( err ){
						deferred.reject(new Error(err))
					}else{
						for(var i in files){
							_db[ node.path.parse(files[i])['name'] ]
								= new node.nedb({
										filename: 	node.path.join(_g.path.db, '/' + files[i])
									})
						}
						deferred.resolve(files)
					}
				})
				return deferred.promise
			})

		// 读取db
			.then(function(){
				_g.log('Preload All DBs: START')
				var the_promises = []
					,dbs = []
					,loaded_count = 0

				for( var db_name in _db ){
					dbs.push(db_name)
				}

				dbs.forEach(function(db_name){
					var deferred = Q.defer()
					function _done(_db_name){
						_g.log('DB ' + _db_name + ' DONE')
						deferred.resolve()
						loaded_count++
						if( loaded_count >= dbs.length ){
							_g.log('Preload All DBs: DONE')
							setTimeout(function(){
								_frame.app_main.loaded('dbs')
							}, 100)
						}
					}
					_db[db_name].loadDatabase(function(err){
						if( err ){
							deferred.reject(new Error(err))
						}else{
							switch( db_name ){
								/*
									case 'entities':
									case 'items':
									case 'item_types':
									case 'ship_classes':
									case 'ship_types':
										_db[db_name].find({}, function(err, docs){
											if( typeof _g.data[db_name] == 'undefined' )
												_g.data[db_name] = {}
											for(var i in docs ){
												_g.data[db_name][docs[i]['id']] = docs[i]
											}
											_db_load_next()
										})
										break;
									*/
								case 'ships':
									_done(db_name);
									break;
								case 'ship_namesuffix':
									_db.ship_namesuffix.find({}).sort({ 'id': 1 }).exec(function(dberr, docs){
										if( dberr ){
											deferred.reject(new Error(dberr))
										}else{
											_g.data.ship_namesuffix = [{}].concat(docs)
											_frame.app_main.loaded('db_namesuffix')
											_done(db_name)
										}
									})
									break;
								case 'ship_type_order':
									_db.ship_type_order.find({}).sort({'id': 1}).exec(function(dberr, docs){
										if( dberr ){
											deferred.reject(new Error(dberr))
										}else{
											for(var i in docs ){
												_g.ship_type_order.push(
													docs[i]['types'].length > 1 ? docs[i]['types'] : docs[i]['types'][0]
												)
												//_g.data['ship_type_order'][docs[i]['id']] = docs[i]
												_g.data['ship_type_order'][i] = docs[i]
												_g.ship_type_order_name.push( docs[i]['name'] )
											}
											// ship type -> ship order
												(function(){
													for( var i in _g.ship_type_order ){
														var index = parseInt(i)
														if( typeof _g.ship_type_order[i] == 'object' ){
															for( var j in _g.ship_type_order[i] ){
																_g.ship_type_order_map[ _g.ship_type_order[i][j] ] = index
															}
														}else{
															_g.ship_type_order_map[ _g.ship_type_order[i] ] = index
														}
													}
												})()
											_db.ships.find({}).sort({
												//'class': 1, 'class_no': 1, 'series': 1, 'type': 1, 'time_created': 1, 'name.suffix': 1
												'type': 1, 'class': 1, 'class_no': 1, 'time_created': 1, 'name.suffix': 1
											}).exec(function(dberr2, docs){
												if( dberr2 ){
													deferred.reject(new Error(dberr))
												}else{
													for(var i in docs){
														_g.data.ships[docs[i]['id']] = new Ship(docs[i])

														if( typeof _g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ] == 'undefined' )
															_g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ] = []
														_g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ].push( docs[i]['id'] )
													}
													function __(i){
														var j=0
														while(
															_g.data.ship_id_by_type[i]
															&& _g.data.ship_id_by_type[i][j]
														){
															var id = _g.data.ship_id_by_type[i][j]
																,i_remodel
															if( _g.data.ships[id].remodel_next
																&& _g.data.ships[_g.data.ships[id].remodel_next]
																&& _g.data.ships[id].remodel_next != _g.data.ship_id_by_type[i][j+1]
																&& (i_remodel = $.inArray(_g.data.ships[id].remodel_next, _g.data.ship_id_by_type[i])) > -1
															){
																_g.log(
																	id
																	+ ', ' + _g.data.ships[id].remodel_next
																	+ ', ' + i_remodel
																)
																_g.data.ship_id_by_type[i].splice(
																	i_remodel,
																	1
																)
																_g.data.ship_id_by_type[i].splice(
																	$.inArray(id, _g.data.ship_id_by_type[i])+1,
																	0,
																	_g.data.ships[id].remodel_next
																)
																//console.log(_g.data.ship_id_by_type[i])
																__(i)
																break
															}
															if( j >= _g.data.ship_id_by_type[i].length - 2 ){
																i++
																j=0
															}else{
																j++
															}
														}
													}
													__(0)
													_done(db_name)
												}
											})
										}
									})
									break;
								case 'updates':
									if( typeof _g.data[db_name] == 'undefined' )
										_g.data[db_name] = {}
									_done(db_name)
									break;
								case 'arsenal_all':
									_g.data['arsenal_all'] = []
									_db.arsenal_all.find({}).sort({
										'sort': 1
									}).exec(function(err, docs){
										for(var i in docs){
											_g.data['arsenal_all'].push(docs[i]['id'])
										}
										_done(db_name)
									})
									break;
								case 'arsenal_weekday':
									_g.data['arsenal_weekday'] = {}
									_db.arsenal_weekday.find({}).sort({
										'weekday': 1
									}).exec(function(err, docs){
										for(var i in docs){
											_g.data['arsenal_weekday'][parseInt(i)]
												= docs[i].improvements
										}
										_done(db_name)
									})
									break;
								default:
									_db[db_name].find({}, function(dberr, docs){
										if( dberr ){
											deferred.reject(new Error(dberr))
										}else{
											if( typeof _g.data[db_name] == 'undefined' )
												_g.data[db_name] = {}
											for(var i in docs ){
												switch( db_name ){
													case 'items':
														_g.data[db_name][docs[i]['id']] = new Equipment(docs[i])
														break;
													default:
														_g.data[db_name][docs[i]['id']] = docs[i]
														break;
												}
											}
											_done(db_name)
										}
									})
									break;
							}

						}
					})
					the_promises.push(deferred.promise)
				})

				return Q.all(the_promises);
			})

		// 根据装备大类和类型排序整理装备ID
			.then(function(){
				var deferred = Q.defer()
				_g.data.item_id_by_type = []
				_g.item_type_order = []
				var type_by_collection = {}
					,type_order_map = {}
				// 遍历大类
					for(var i in _g.data.item_type_collections){
						for(var j in _g.data.item_type_collections[i]['types']){
							type_by_collection[ _g.data.item_type_collections[i]['types'][j] ] = i
							_g.item_type_order.push( _g.data.item_type_collections[i]['types'][j] )
							type_order_map[ _g.data.item_type_collections[i]['types'][j] ] = _g.item_type_order.length - 1
						}
					}
				// 遍历装备数据
					for(var i in _g.data.items){
						var order = type_order_map[ _g.data.items[i]['type'] ]
						if( !_g.data.item_id_by_type[order] )
							_g.data.item_id_by_type[order] = {
								'collection': type_by_collection[_g.data.items[i]['type']],
								'equipments': [],
								'names': []
							}
						_g.data.item_id_by_type[order]['equipments'].push( _g.data.items[i]['id'] )
						_g.data.item_id_by_type[order]['names'].push( _g.data.items[i].getName() )
					}
				// 排序
					for(let i in _g.data.item_id_by_type){
						_g.data.item_id_by_type[i]['equipments'].sort(function(a, b){
							let diff = _g.data.items[a].getPower() - _g.data.items[b].getPower()
							if( diff === 0 ){
								let diff_aa = _g.data.items[a]['stat']['aa'] - _g.data.items[b]['stat']['aa']
								if( diff_aa === 0 ){
									return _g.data.items[a]['stat']['hit'] - _g.data.items[b]['stat']['hit']
								}
								return diff_aa
							}
							return diff
						})
					}
				setTimeout(function(){
					deferred.resolve()
				}, 100)
				return deferred.promise
			})

		// 读取db
		/*
			var _db_size = 0
				,_db_loaded = 0
			for( var i in _db )
				_db_size++
			function _db_load( db_name ){
				_db[db_name].loadDatabase(function(err){
					if( err ){

					}else{
						_db_loaded++

						switch( db_name ){
							case 'item_types':
								_db.item_types.find({}, function(err, docs){
									for(var i in docs ){
										_g.data.item_types[docs[i]['id']] = docs[i]
									}
								})
								break;
							case 'ship_namesuffix':
								_db.ship_namesuffix.find({}).sort({ 'id': 1 }).exec(function(err, docs){
									_g.data.ship_namesuffix = [{}].concat(docs)
									_frame.app_main.loaded('db_namesuffix')
								})
								break;
							case 'ship_types':
								_db.ship_types.find({}, function(err, docs){
									for(var i in docs ){
										_g.data.ship_types[docs[i]['id']] = docs[i]
									}
								})
								break;
							case 'ship_type_order':
								// ship type -> ship order
								function map_do(){
									for( var i in _g.ship_type_order ){
										var index = parseInt(i)
										if( typeof _g.ship_type_order[i] == 'object' ){
											for( var j in _g.ship_type_order[i] ){
												_g.ship_type_order_map[ _g.ship_type_order[i][j] ] = index
											}
										}else{
											_g.ship_type_order_map[ _g.ship_type_order[i] ] = index
										}
									}
								}
								_db.ship_type_order.find({}).sort({'id': 1}).exec(function(err, docs){
									for(var i in docs ){
										_g.ship_type_order.push(
											docs[i]['types'].length > 1 ? docs[i]['types'] : docs[i]['types'][0]
										)
										_g.ship_type_order_name.push( docs[i]['name'] )
									}
									map_do()
								})
								break;
						}

						if( _db_loaded >= _db_size )
							_frame.app_main.loaded('dbs')
					}
				})
			}
			for( var i in _db ){
				_db_load(i)
			}
		*/

		_frame.app_main.is_init = true
	}
}


class ITEM {
	constructor() {
	}

	getName(language){
		language = language || _g.lang
		return this['name']
				? (this['name'][language] || this['name'])
				: null
	}
	
	get _name(){
		return this.getName()
	}
}

class Ship extends ITEM{
	constructor(data){
		super()
		$.extend(true, this, data)
	}
	
	getName(joint, language){
		joint = joint || ''
		language = language || _g.lang
		return (
				this['name'][language] || this['name']['ja_jp']
				) + (
				this['name'].suffix ? (
						(joint === true ? _g.joint : joint)
						+ (
								_g.data['ship_namesuffix'][this['name'].suffix][language]
								|| _g.data['ship_namesuffix'][this['name'].suffix]['ja_jp']
							)
					) : ''
				)
	}
	
	getType(language){
		language = language || _g.lang
		return this['type']
				? _g['data']['ship_types'][this['type']]['full_zh']
				: null
	}
	
	getSeriesData(){
		return this['series']
				? _g['data']['ship_series'][this['series']]['ships']
				: []
	}
}

class Equipment extends ITEM{
	constructor(data) {
		super()
		$.extend(true, this, data)
	}
	
	getName(small_brackets, language){
		language = language || _g.lang
		var result = ITEM.prototype.getName.call(this, language)
			//,result = super.getName(language)
			,small_brackets_tag = small_brackets && !small_brackets === true ? small_brackets : 'small'
		return small_brackets
				? result.replace(/（([^（^）]+)）/g, '<'+small_brackets_tag+'>($1)</'+small_brackets_tag+'>')
				: result
	}
	
	getType(language){
		language = language || _g.lang
		return this['type']
				? _g['data']['item_types'][this['type']]['name'][language]
				: null
	}

	getIconId(){
		return _g.data.item_types[this['type']]['icon']
	}
	
	getCaliber(){
		let name = this.getName(false, 'ja_jp')
			,caliber = parseFloat(name)
		
		return caliber
	}
	
	getPower(){
		return this.stat[
			_g.data['item_types'][this['type']]['main_attribute'] || 'fire'
		]
		/*
		switch( this['type'] ){
			// Guns
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 6:
				case 7:
				case 8:
				case 9:
		}
		*/
	}
}

_frame.app_main.page['home'] = {}


node.require('http')
node.require('url')

_frame.app_main.page['init'] = {}

var __log

_frame.app_main.page['init'].data_ships = null
_frame.app_main.page['init'].fetch_ships = function(){
	__log('fetching data for ships...')
	var url = node.url.parse( $('#data_ships').val() )
	//var req = node.http.get( $('#data_ships').val(), function(res){
	var req = node.http.request({
		'hostname': 	url.hostname,
		'path': 		url.path,
		'method': 		'GET',
		'headers': {
			'User-Agent': 	'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36'
		}
	}, function(res){
		if( res.statusCode == 200 ){
			res.setEncoding('utf8');
			var body = ''
			res.on('data', function (d) {
				body+= d
			});
			res.on('end', function() {
				//res.setEncoding('utf8');
				body = body.replace(/^var [^ ^\=]+[ ]*=/, '')
				eval('_frame.app_main.page[\'init\'].data_ships = ' + body)
				__log('fetched data for ships (' + _frame.app_main.page['init'].data_ships.length + ').')

				// 将Array内所有数据分别存放至 ./fetched_data/ships/
					node.mkdirp.sync(_g.path.fetched.ships)
					function savedata_next(){
						_frame.app_main.page['init'].data_ships.shift()
						if( _frame.app_main.page['init'].data_ships.length ){
							setTimeout( function(){
								savedata()
							}, 10 )
						}else{
							__log('all data for ships saved.')
							_frame.app_main.page['init'].fetch_items()
						}
					}
					function savedata(){
						var o = _frame.app_main.page['init'].data_ships[0]
						_db.ships.find({'id': parseInt(o.id)}, function(err, docs){
							if( err || !docs || !docs.length ){
								node.fs.writeFile(_g.path.fetched.ships + '/' + o.id + '.json'
									, JSON.stringify(o)
									, function(err) {
										if(err) {
											console.log(err);
										} else {
											__log('saved data file for ship ['+o.id+'] No.'+o.no+' '+ o.name +'.')
										}
										savedata_next()
									})
							}else{
								__log('data for ship ['+o.id+'] No.'+o.no+' '+ o.name +' exists in database. skip.')
								savedata_next()
							}
						})
					}
					savedata()
			});
		}else{
			__log("fetching error: CODE " + res.statusCode);
		}
	});
	req.end();
}

_frame.app_main.page['init'].data_items = null
_frame.app_main.page['init'].fetch_items = function(){
	__log('fetching data for items...')
	var url = node.url.parse( $('#data_items').val() )
	//var req = node.http.get( $('#data_items').val(), function(res){
	var req = node.http.request({
		'hostname': 	url.hostname,
		'path': 		url.path,
		'method': 		'GET',
		'headers': {
			'User-Agent': 	'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36'
		}
	}, function(res){
		if( res.statusCode == 200 ){
			res.setEncoding('utf8');
			var body = ''
			res.on('data', function (d) {
				body+= d
			});
			res.on('end', function() {
				//res.setEncoding('utf8');
				body = body.replace(/^var [^ ^\=]+[ ]*=/, '')
				eval('_frame.app_main.page[\'init\'].data_items = ' + body)
				__log('fetched data for items (' + _frame.app_main.page['init'].data_items.length + ').')

				// 将Array内所有数据分别存放至 ./fetched_data/ships/
					node.mkdirp.sync(_g.path.fetched.items)
					function savedata_next(){
						_frame.app_main.page['init'].data_items.shift()
						if( _frame.app_main.page['init'].data_items.length ){
							setTimeout( function(){
								savedata()
							}, 10 )
						}else{
							__log('all data for items saved.')
						}
					}
					function savedata(){
						var o = _frame.app_main.page['init'].data_items[0]
						_db.items.find({'id': parseInt(o.id)}, function(err, docs){
							if( err || !docs || !docs.length ){
								node.fs.writeFile(_g.path.fetched.items + '/' + o.id + '.json'
									, JSON.stringify(o)
									, function(err) {
										if(err) {
											console.log(err);
										} else {
											__log('saved data file for item ['+o.id+'] '+ o.name +'.')
										}
										savedata_next()
									})
							}else{
								__log('data for item ['+o.id+'] '+ o.name +' exists in database. skip.')
								savedata_next()
							}
						})
					}
					savedata()
			});
		}else{
			__log("fetching error: CODE " + res.statusCode);
		}
	});
	req.end();
}










_frame.app_main.page['init'].remain_illustrations = []
_frame.app_main.page['init'].init_illustrations = function(){
	__log('start initializing illustrations for ships...')

	function move_files(){
		if( _frame.app_main.page['init'].remain_illustrations.length ){
			var oldPath = _frame.app_main.page['init'].remain_illustrations[0]
				,newPath = node.path.normalize( _g.path.pics.ships + '/' + node.path.relative( './fetched_data/ships_pic/', oldPath ) )

			node.fs.rename(
				oldPath,
				newPath,
				function(err){
					__log('file moved to '+ newPath +'.')
					_frame.app_main.page['init'].remain_illustrations.shift()
					setTimeout( function(){
						move_files()
					}, 10 )
				}
			)
		}else{
			__log('all illustrations for ships files moved...')
		}
	}

	node.fs.readdir('./fetched_data/ships_pic/', function(err, files){
		if( !err ){
			for( var i in files ){
				_frame.app_main.page['init'].remain_illustrations.push('./fetched_data/ships_pic/' + files[i] + '/0.jpg')
				_frame.app_main.page['init'].remain_illustrations.push('./fetched_data/ships_pic/' + files[i] + '/1.jpg')
				_frame.app_main.page['init'].remain_illustrations.push('./fetched_data/ships_pic/' + files[i] + '/2.jpg')
				_frame.app_main.page['init'].remain_illustrations.push('./fetched_data/ships_pic/' + files[i] + '/3.jpg')
				_frame.app_main.page['init'].remain_illustrations.push('./fetched_data/ships_pic/' + files[i] + '/8.png')
				_frame.app_main.page['init'].remain_illustrations.push('./fetched_data/ships_pic/' + files[i] + '/9.png')
				_frame.app_main.page['init'].remain_illustrations.push('./fetched_data/ships_pic/' + files[i] + '/10.png')

				node.mkdirp.sync( _g.path.pics.ships + '/' + files[i] )

				if( i >= files.length - 1 )
					move_files()
			}
		}
	})
}












_frame.app_main.page['init'].exportdata = function( form ){
	var dest 			= form.find('[name="destfolder"]').val()
		,files 			= []
		,promise_chain 	= Q.fcall(function(){})
		,_ship			= {}
		,_item			= {}

	// 开始异步函数链
		promise_chain
	
	// 遍历全部数据 (舰娘 & 装备)
		.then(function(){
			var deferred = Q.defer()
			_db.ships.find({}, function(err, docs){
				for( var i in docs ){
					_ship[docs[i]['id']] = new Equipment(docs[i])
				}
				console.log(_ship)
				deferred.resolve()
			})
			return deferred.promise
		})
		.then(function(){
			var deferred = Q.defer()
			_db.items.find({}, function(err, docs){
				for( var i in docs ){
					_item[docs[i]['id']] = new Ship(docs[i])
				}
				console.log(_item)
				deferred.resolve()
			})
			return deferred.promise
		})

	// 获取文件列表
		.then(function(){
			var deferred = Q.defer()
			node.fs.readdir('./data/', function(err, arrfiles){
				if( err ){
					deferred.reject( err )
				}else{
					files = arrfiles
					deferred.resolve( arrfiles )
				}
			})
			return deferred.promise
		})

	// 装备 - 初始装备于
		.then(function(){
			var deferred = Q.defer()
				,equipped_by_item_id = {}
				,length = 0

			__log('&nbsp;')
			__log('========== 装备数据 - 初始装备于 ==========')
			__log('= 批处理开始')

			function _get_ships( item_id, _id, _index ){
				_db.ships.find({"equip": item_id}, function(err2, docs2){
					var ships_equipped = {}
					for(var j in docs2){
						if( typeof ships_equipped[docs2[j]['series']] == 'undefined' )
							ships_equipped[docs2[j]['series']] = []
						ships_equipped[docs2[j]['series']].push( docs2[j] )
					}
					for(var j in ships_equipped){
						ships_equipped[j].sort(function(a,b){
							return a['name']['suffix'] - b['name']['suffix']
						})
						for( var k in ships_equipped[j] ){
							equipped_by_item_id[_id].push( ships_equipped[j][k]['id'] )
							//d['default_equipped_on'].push( ships_equipped[j][k]['id'] )
						}
					}
					if( _index >= length - 1 )
						_db_do_all()
				})
			}
			function _db_do_all(){
				function _db_do( _id, set_data, _index ){
					_db.items.update({
						'_id': 		_id
					},{
						$set: set_data
					},{}, function(err, numReplaced){
						if( _index >= length - 1 ){
							__log('= 批处理完毕')
							deferred.resolve()
						}
					})
				}
				var index = 0
				for(var i in equipped_by_item_id){
					var _equipped_data = [];
					$.each(equipped_by_item_id[i], function(i, el){
						if($.inArray(el, _equipped_data) === -1) _equipped_data.push(el);
					});
					_db_do(
						i,
						{
							'default_equipped_on': _equipped_data
						},
						index
					)
					index++
				}
			}
			_db.items.find({}, function(err, docs){
				for( var i in docs ){
					var d = docs[i]
					equipped_by_item_id[d['_id']] = []
					length++
					_get_ships(d['id'], d['_id'], i)
				}
			})
			return deferred.promise
		})

	// 装备 - 改修升级前后关系
		.then(function(){
			// 遍历所有装备的 upgrade_to 数据，重组关系表
			var deferred = Q.defer()
				,_upgrade_from = {}
				,length = 0

			__log('&nbsp;')
			__log('========== 装备数据 - 改修升级前后关系 ==========')
			__log('= 批处理开始')

			_db.items.find({}, function(err, docs){
				for( var i in docs ){
					var d = docs[i]

					if( !_upgrade_from[d['id']] )
						_upgrade_from[d['id']] = [null, []]
					_upgrade_from[d['id']][0] = d['_id']

					length++

					if( d['upgrade_to'] && d['upgrade_to'].length ){
						for( var j in d['upgrade_to'] ){
							var _id = d['upgrade_to'][j][0]
							if( !_upgrade_from[_id] )
								_upgrade_from[_id] = [null, []]
							_upgrade_from[_id][1].push( d['id'] )
						}
					}
				}
				console.log( _upgrade_from )
				_db_do_all()
			})
			function _db_do_all(){
				function _db_do( _id, set_data, _index ){
					_db.items.update({
						'_id': 		_id
					},{
						$set: set_data
					},{}, function(err, numReplaced){
						if( _index >= length - 1 ){
							__log('= 批处理完毕')
							deferred.resolve()
						}
					})
				}
				var index = 0
				for(var i in _upgrade_from){
					_db_do(
						_upgrade_from[i][0],
						{
							'upgrade_from': _upgrade_from[i][1]
						},
						index
					)
					index++
				}
			}
			return deferred.promise
		})

	// 改修工厂 - 每日改修 & 改修明细
		.then(function(){
			var deferred 		= Q.defer()
				,data_weekday 	= []
				,index_weekday 	= []
				,data_all 		= []
				,_promise_chain = Q.fcall(function(){})

			__log('&nbsp;')
			__log('========== 改修工厂 - 每日改修 & 改修明细 ==========')
			__log('= 批处理开始')

			for( var i=0; i<7; i++){
				data_weekday[i] = {
					'weekday':	i,
					'improvements': []
					// equipment_id, improvement_index, requirement_index
				}
				index_weekday[i] = {}
			}

			for(let m in _g.data.item_id_by_type){
				for(let n in _g.data.item_id_by_type[m]['equipments']){
					let d = _item[_g.data.item_id_by_type[m]['equipments'][n]]
			
			console.log(_g.data.item_id_by_type[m]['equipments'][n], d)
					if( d.improvement && d.improvement.length ){
						data_all.push({
							'id':	d['id'],
							'sort': data_all.length
						})

						for(var j in d.improvement){
							for(var k in d.improvement[j].req){
								var req = d.improvement[j].req[k]
								for(var l=0; l<7; l++){
									if(req[0][l]){
										var index = d['id'] + '_' + parseInt(j)
										if( typeof index_weekday[l][index] == 'undefined' ){
											index_weekday[l][index] = data_weekday[l].improvements.length
											data_weekday[l].improvements.push([
												d['id'],
												parseInt(j),
												[parseInt(k)]
											])
										}else{
											data_weekday[l].improvements[index_weekday[l][index]][2].push(parseInt(k))
										}
									}
								}
							}
						}
					}
				}
			}

			_promise_chain

			// 遍历全部装备数据
				//.then(function(){
					//var _deferred = Q.defer()
					/*
					_db.items.find({}).sort({'type': 1, 'rarity': 1, 'id': 1}).exec(function(err, docs){
						for( var i in docs ){
							var d = docs[i]
							if( d.improvement && d.improvement.length ){
								data_all.push({
									'id':	d['id'],
									'sort': data_all.length
								})

								for(var j in d.improvement){
									for(var k in d.improvement[j].req){
										var req = d.improvement[j].req[k]
										for(var l=0; l<7; l++){
											if(req[0][l]){
												var index = d['id'] + '_' + parseInt(j)
												if( typeof index_weekday[l][index] == 'undefined' ){
													index_weekday[l][index] = data_weekday[l].improvements.length
													data_weekday[l].improvements.push([
														d['id'],
														parseInt(j),
														[parseInt(k)]
													])
												}else{
													data_weekday[l].improvements[index_weekday[l][index]][2].push(parseInt(k))
												}
											}
										}
									}
								}

								_deferred.resolve()
							}
						}
					})
					*/
					//return _deferred.promise
					//return true
				//})

			// 清空原有数据库
				.then(function(){
					var _deferred = Q.defer()
					_db.arsenal_all.remove({}, { multi: true }, function (err, numRemoved) {
						_deferred.resolve()
					});
					return _deferred.promise
				})
				.then(function(){
					var _deferred = Q.defer()
					_db.arsenal_weekday.remove({}, { multi: true }, function (err, numRemoved) {
						_deferred.resolve()
					});
					return _deferred.promise
				})

			// 写入数据库
				.then(function(){
					var _deferred = Q.defer()
					_db.arsenal_all.insert(data_all, function (err, newDocs) {
						_deferred.resolve()
					})
					return _deferred.promise
				})
				.then(function(){
					var _deferred = Q.defer()
					_db.arsenal_weekday.insert(data_weekday, function (err, newDocs) {
						_deferred.resolve()
					})
					return _deferred.promise
				})

			// 完成
				.then(function(){
					__log('= 批处理完成')
					deferred.resolve()
				})

			return deferred.promise
		})

	// 2015/05/26 - 取消装备类型的 equipable_on_stat 属性
	/*
		.then(function(){
			var deferred = Q.defer()
				,count = 0
				,length = 0

			__log( '&nbsp;' )
			__log('========== 取消装备类型的 equipable_on_stat 属性 ==========')
			__log( '= 批处理开始' )

			_db.item_types.find({}, function(err, docs){
				length = docs.length
				for(var i in docs){
					_db.item_types.update({
						'_id': 		docs[i]['_id']
					},{
						$unset: {
							'equipable_on_stat': true
						}
					},{}, function(err, numReplaced){
						count++
						if( count >= length ){
							__log('= 批处理完毕')
							deferred.resolve()
						}
					})
				}
			})

			return deferred.promise
		})
	*/

	// 复制所有数据文件
		.then(function(){
			var deferred = Q.defer()
				,count = 0

			__log( '&nbsp;' )
			__log('========== 复制数据库JSON ==========')

			// 建立目标目录
				node.mkdirp.sync( dest )

			function copyFile(source, target, callback) {
				var cbCalled = false;

				var rd = node.fs.createReadStream(source);
				rd.on("error", function(err) {
					done(err);
				});

				var wr = node.fs.createWriteStream(target);
					wr.on("error", function(err) {
					done(err);
				});
				wr.on("close", function(ex) {
					done();
				});

				rd.pipe(wr);

				function done(err) {
					if (!cbCalled) {
						callback(err, source, target);
						cbCalled = true;
					}
				}
			}
			function copyFile_callback( err, source, target ){
				count++
				if( !err ){
					__log( '= 数据库JSON已复制到 ' + target )
				}else{
					console.log(err)
				}
				if( count >= files.length ){
					__log( '= 全部数据库JSON已复制' )
					deferred.resolve()
				}
			}

			// 压缩 (Compacting) 全部数据库
				for( var i in _db ){
					_db[i].persistence.compactDatafile()
				}

			for( var i in files ){
				copyFile(
					'./data/' + files[i],
					dest + '/' + files[i],
					copyFile_callback
				)
			}
			return deferred.promise
		})

	// 错误处理
		.catch(function (err) {
			__log(err)
			__log('输出数据失败')
		})
		.done(function(){
			__log('输出数据初始过程结束')
		})
}












_frame.app_main.page['init'].exportpic = function( form ){
	var dest = form.find('[name="destfolder"]').val()
		,ship_ids = node.fs.readdirSync('./pics/ships/')
		,item_ids = node.fs.readdirSync('./pics/items/')
		,files = []
		,picid_by_shipid = {}
		,promise_chain 	= Q.fcall(function(){})

	function check_do( file, dest, quality, is_lossless ){
		try{
			var stat = node.fs.lstatSync(file)
			if( stat && stat.isFile() ){
				files.push([
					file,
					dest,
					quality,
					is_lossless
				])
			}
		}catch(e){}
	}

	node.mkdirp.sync( dest + '/ships/' )
	node.mkdirp.sync( dest + '/items/' )

	var execFile = require('child_process').execFile;
	var binPath = require('webp-bin').path;

	function copyFile_webp(source, target, quality, is_lossless) {
		source = source || files[0][0]
		target = target || files[0][1]
		quality = (quality || files[0][2]) || 75
		is_lossless = (is_lossless || files[0][3]) || false

		//var cmd = (source + ' -lossless -q 100 -o ' + target).split(/\s+/)
		var cmd = (source + (is_lossless ? ' -lossless' : '') + ' -q ' + quality + ' -o ' + target).split(/\s+/)
		//var cmd = (source + ' -q 85 -o ' + target).split(/\s+/)
		execFile(binPath, cmd, function(err, stdout, stderr) {
			if( !err ){
				__log(
					'pic file copied to ' + target
				)
				files.shift()
				copyFile_webp();
			}
		});

		/*

		var CWebp = require('cwebp').CWebp
			,encoder = new CWebp(source)

		encoder.write(target, function(err) {
			console.log(err || 'encoded successfully');
			__log(
				'pic file copied to ' + target
			)
			files.shift()
			copyFile_webp();
		});
		*/

		/*
		var cbCalled = false;

		var rd = node.fs.createReadStream(source);
		rd.on("error", function(err) {
			done(err);
		});

		var wr = node.fs.createWriteStream(target);
			wr.on("error", function(err) {
			done(err);
		});
		wr.on("close", function(ex) {
			done();
		});

		rd.pipe(wr);

		function done(err) {
			if (!cbCalled) {
				__log(
					'pic file copied to ' + target
				)
				files.shift()
				copyFile_webp();
				cbCalled = true;
			}
		}
		*/
	}

	// 开始异步函数链
		promise_chain

	// 遍历 ship_series
		.then(function(){
			deferred = Q.defer()
			_db.ship_series.find({}, function(err,docs){
				for(var i in docs){
					var ships = docs[i].ships || []
					for(var j in ships){
						if(ships[j]['id']){
							picid_by_shipid[ships[j]['id']] = []
							picid_by_shipid[ships[j]['id']].push(['0.png', '0.webp', 90])
							if( !ships[j]['illust_delete'] ){
								picid_by_shipid[ships[j]['id']].push(['8.png', '8.webp', 85])
								picid_by_shipid[ships[j]['id']].push(['9.png', '9.webp', 85])
								picid_by_shipid[ships[j]['id']].push(['10.png', '10.webp', 75])
							}
							var extra = ships[j]['illust_extra'] || []
							for(var l in extra){
								picid_by_shipid['extra_' + extra[l]] = []
								picid_by_shipid['extra_' + extra[l]].push(['8.png', '8.webp', 85])
								picid_by_shipid['extra_' + extra[l]].push(['9.png', '9.webp', 85])
							}
						}
					}
					deferred.resolve(picid_by_shipid)
				}
			})
			return deferred.promise
		})

	// 遍历 ship_ids, item_ids
		.then(function(picid_by_shipid){
			for( var i in ship_ids ){
				node.mkdirp.sync( dest + '/ships/' + ship_ids[i] )
				var arr = picid_by_shipid[ship_ids[i]] || null
				if( !arr ){
					arr = []
					arr.push(['0.png', '0.webp', 90])
					arr.push(['8.png', '8.webp', 85])
					arr.push(['9.png', '9.webp', 85])
					arr.push(['10.png', '10.webp', 75])
				}
				for(var j in arr){
					check_do(
						'./pics/ships/' + ship_ids[i] + '/' + arr[j][0],
						dest + '/ships/' + ship_ids[i] + '/' + arr[j][1],
						arr[j][2]
					)
				}
			}
			for( var i in item_ids ){
				node.mkdirp.sync( dest + '/items/' + item_ids[i] )
				check_do(
					'./pics/items/' + item_ids[i] + '/card.png',
					dest + '/items/' + item_ids[i] + '/card.webp',
					80
				)
			}
			return files
		})

	// webp
		.then(function(files){
			return copyFile_webp()
		})

	return true

	for( var i in ship_ids ){
		node.mkdirp.sync( dest + '/ships/' + ship_ids[i] )
		check_do(
			'./pics/ships/' + ship_ids[i] + '/0.jpg',
			dest + '/ships/' + ship_ids[i] + '/0.webp',
			90
		)
		check_do(
			'./pics/ships/' + ship_ids[i] + '/8.png',
			dest + '/ships/' + ship_ids[i] + '/8.webp',
			85
			//100,
			//true
		)
		check_do(
			'./pics/ships/' + ship_ids[i] + '/9.png',
			dest + '/ships/' + ship_ids[i] + '/9.webp',
			85
			//100,
			//true
		)
		/*
		files.push([
			'./pics/ships/' + ship_ids[i] + '/0.jpg',
			dest + '/ships/' + ship_ids[i] + '/0.jpg'
		])
		files.push([
			'./pics/ships/' + ship_ids[i] + '/2.jpg',
			dest + '/ships/' + ship_ids[i] + '/2.jpg'
		])
		*/
	}

	for( var i in item_ids ){
		node.mkdirp.sync( dest + '/items/' + item_ids[i] )
		check_do(
			'./pics/items/' + item_ids[i] + '/card.png',
			dest + '/items/' + item_ids[i] + '/card.webp',
			80
		)
		/*
		files.push([
			'./pics/items/' + item_ids[i] + '/card.png',
			dest + '/items/' + item_ids[i] + '/card.png'
		])
		*/
	}

	copyFile_webp()
}
















_frame.app_main.page['init'].init = function( page ){
	var _log = function(data){
		$('<p/>').html(data).prependTo(logs)
	}
	__log = function(data){
		console.log(data)
		$('<p/>').html(data).prependTo(logs)
	}

	var logs = $('<div class="logs">').appendTo(page)

	// 获取舰娘&装备数据
	page.find('form#init_all_data').on('submit', function(e){
		var form = $(this)
		e.preventDefault()
		form.addClass('submitting')
		form.find('[type="submit"]').on('click',function(e){
			e.preventDefault()
		})

			_frame.app_main.page['init'].fetch_ships()
	})

	// 处理图鉴文件
	page.find('form#init_illustrations').on('submit', function(e){
		var form = $(this)
		e.preventDefault()
		form.addClass('submitting')
		form.find('[type="submit"]').on('click',function(e){
			e.preventDefault()
		})

			_frame.app_main.page['init'].init_illustrations()
	})

	// 导出数据
	page.find('form#init_exportdata').each( function(){
		var form = $(this)
			,folder_input = form.find('[name="destfolder"]')
			,btn_browse = form.find('[value="Browse..."]')
			,file_selector = form.find('[type="file"]')

		form.on('submit', function(e){
			e.preventDefault()
			form.addClass('submitting')
			form.find('[type="submit"]').on('click',function(e){
				e.preventDefault()
			})
			_frame.app_main.page['init'].exportdata( form )
		})

		folder_input
			.val( _config.get( 'data_export_to' ) )
			.on({
				'change': function(){
					_config.set( 'data_export_to', $(this).val() )
				},
				'click': function(){
					btn_browse.trigger('click')
				}
			})

		btn_browse
			.on('click', function(){
				//console.log(123)
				//form.find('[type="file"]').trigger('click')
			})

		file_selector
			.on('change', function(){
				folder_input.val( $(this).val() ).trigger('change')
			})
	})

	// 导出图片
	page.find('form#init_exportpic').each( function(){
		var form = $(this)
			,folder_input = form.find('[name="destfolder"]')
			,btn_browse = form.find('[value="Browse..."]')
			,file_selector = form.find('[type="file"]')

		form.on('submit', function(e){
			e.preventDefault()
			form.addClass('submitting')
			form.find('[type="submit"]').on('click',function(e){
				e.preventDefault()
			})
			_frame.app_main.page['init'].exportpic( form )
		})

		folder_input
			.val( _config.get( 'pics_export_to' ) )
			.on({
				'change': function(){
					_config.set( 'pics_export_to', $(this).val() )
				},
				'click': function(){
					btn_browse.trigger('click')
				}
			})

		btn_browse
			.on('click', function(){
				//console.log(123)
				//form.find('[type="file"]').trigger('click')
			})

		file_selector
			.on('change', function(){
				folder_input.val( $(this).val() ).trigger('change')
			})
	})

	// 获取官方数据
		page.find('form#fetch_official').on('submit', function(e){
			var form = $(this)
			e.preventDefault()
			__log('开始获取官方游戏数据 (api_start2)...')
			/*
				Remote Address:127.0.0.1:7070
				Request URL:http://203.104.209.23/kcsapi/api_start2
				Request Method:POST
				Status Code:200 OK

				header
				Accept:*//*
				Accept-Encoding:gzip, deflate
				Accept-Language:zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2
				Cache-Control:no-cache
				Connection:keep-alive
				Content-Length:66
				Content-Type:application/x-www-form-urlencoded
				Host:203.104.209.23
				Origin:http://203.104.209.23
				Pragma:no-cache
				Referer:http://203.104.209.23/kcs/mainD2.swf?api_token=1d28ef72b4669737e86d6af05ed53652dde0d744&api_starttime=1431008607402/[[DYNAMIC]]/1
				User-Agent:Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36
				X-Requested-With:ShockwaveFlash/17.0.0.169

				form
				api_token:1d28ef72b4669737e86d6af05ed53652dde0d744
				api_verno:1
			*/

			var ip 			= form.find('[name="server_ip"]').val()
				,api_token 	= form.find('[name="api_token"]').val()
				,url 		= node.url.parse( 'http://'+ ip +'/kcsapi/api_start2' )

				,promise_chain 	= Q.fcall(function(){})

			// 开始异步函数链
				promise_chain

			// API: api_start2
				.then(function(){
					var api = node.url.parse( 'http://'+ ip +'/kcsapi/api_start2' )
						,deferred = Q.defer()
					__log('API (api_start2) requesting...')

					request({
						'uri': 		api,
						'method': 	'POST',
						'headers': {
							'Cache-Control': 	'no-cache',
							'Content-Type': 	'application/x-www-form-urlencoded',
							'Pragma': 			'no-cache',
							'Referer': 			'http://'+ip+'/kcs/mainD2.swf?api_token='+ api_token +'&api_starttime='+ _g.timeNow() +'/[[DYNAMIC]]/1',
							'User-Agent': 		'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36',
							'X-Requested-With': 'ShockwaveFlash/17.0.0.169'
						},
						'formData': {
							'api_token': 	api_token,
							'api_verno': 	1
						},
						'proxy': 	proxy
					}, function(err, response, body){
						if(err || response.statusCode != 200){
							console.log(err, response)
							deferred.reject(new Error(err))
						}
						if( !err && response.statusCode == 200 ){
							eval(body)
							console.log(svdata)
							if( svdata.api_result == 1 ){
								jf.writeFile(
									node.path.normalize(_g.root + '/fetched_data/api_start2.json'),
									svdata,
									function(err) {
										if(err){
											deferred.reject(new Error(err))
										}else{
											deferred.resolve()
										}
								})
							}else{
								console.log(svdata)
								deferred.reject(new Error(err))
							}
						}
					})
				})
				.catch(function (err) {
					__log(err)
				})
				.done(function(){
					__log('已获取，数据已保存到文件 /fetched_data/api_start2.json')
				})
		})
}


_frame.app_main.page['ships'] = {}
_frame.app_main.page['ships'].section = {}


_frame.app_main.page['ships'].gen_table = function(d){
	var table = $('<table/>')
	return table
}

_frame.app_main.page['ships'].gen_input = function(type, name, id, value, options){
	options = options || {}
	switch( type ){
		case 'text':
		case 'number':
		case 'hidden':
			var input = $('<input/>',{
				'type': type,
				'name': name,
				'id': 	id
			}).val(value)
			break;
		case 'select':
			var input = $('<select/>',{
				'name': name,
				'id': 	id
			})
			var option_empty = $('<option value=""/>').html('').appendTo( input )
			for( var i in value ){
				if( typeof value[i] == 'object' ){
					var o_el = $('<option value="' + (typeof value[i].val == 'undefined' ? value[i]['value'] : value[i].val) + '"/>')
						.html(value[i]['title'] || value[i]['name'])
						.appendTo( input )
				}else{
					var o_el = $('<option value="' + value[i] + '"/>')
						.html(value[i])
						.appendTo( input )
				}
				if( typeof options['default'] != 'undefined' && o_el.val() == options['default'] ){
					o_el.prop('selected', true)
				}
				if( !o_el.val() ){
					o_el.attr('disabled', true)
				}
			}
			if( !value || !value.length ){
				option_empty.remove()
				$('<option value=""/>').html('...').appendTo( input )
			}
			if( options['new'] ){
				$('<option value="" disabled/>').html('==========').insertAfter( option_empty )
				$('<option value="___new___"/>').html('+ 新建').insertAfter( option_empty )
				input.on('change.___new___', function(){
					var select = $(this)
					if( select.val() == '___new___' ){
						select.val('')
						options['new']( input )
					}
				})
			}
			break;
		case 'select_group':
			var input = $('<select />',{
				'name': name,
				'id': 	id
			})
			var option_empty = $('<option value=""/>').html('').appendTo( input )
			for( var i in value ){
				var group = $('<optgroup label="'+value[i][0]+'"/>').appendTo( input )
				for( var j in value[i][1] ){
					var _v = value[i][1][j]
					if( typeof _v == 'object' ){
						var o_el = $('<option value="' + (typeof _v.val == 'undefined' ? _v['value'] : _v.val) + '"/>')
							.html(_v['title'] || _v['name'])
							.appendTo( group )
					}else{
						var o_el = $('<option value="' + _v + '"/>')
							.html(_v)
							.appendTo( group )
					}
					if( typeof options['default'] != 'undefined' && o_el.val() == options['default'] ){
						o_el.prop('selected', true)
					}
					if( !o_el.val() ){
						o_el.attr('disabled', true)
					}
				}
			}
			if( !value || !value.length ){
				option_empty.remove()
				$('<option value=""/>').html('...').appendTo( input )
			}
			if( options['new'] ){
				$('<option value="" disabled/>').html('==========').insertAfter( option_empty )
				$('<option value="___new___"/>').html('+ 新建').insertAfter( option_empty )
				input.on('change.___new___', function(){
					var select = $(this)
					if( select.val() == '___new___' ){
						select.val('')
						options['new']( input )
					}
				})
			}
			break;
		case 'checkbox':
			var input = $('<input/>',{
				'type': type,
				'name': name,
				'id': 	id
			}).prop('checked', value)
			break;
	}

	if( options.required ){
		input.prop('required', true)
	}

	if( options.onchange ){
		input.on('change.___onchange___', function(){
			options.onchange( $(this) )
		})
		if( options['default'] )
			input.trigger('change')
	}

	if( !name )
		input.attr('name', null)

	return input
}
_frame.app_main.page['ships'].gen_form_line = function(type, name, label, value, suffix, options){
	var line = $('<p/>')
		,id = '_input_g' + _g.inputIndex

	$('<label for="'+id+'"/>').html( label ).appendTo(line)
	_frame.app_main.page['ships'].gen_input(type, name, id, value, options).appendTo(line)
	if( suffix )
		$('<label for="'+id+'"/>').html(suffix).appendTo(line)

	_g.inputIndex++
	return line
}







_frame.app_main.page['ships'].show_ship_form = function(d){
	d.remodel = d.remodel || {}
	d.rels = d.rels || {}
	d.slot = d.slot || []
	d.equip = d.equip || []
	console.log(d)
	function _input(name, label, suffix, options){
		return _frame.app_main.page['ships'].gen_form_line(
			'text', name, label, eval( 'd.' + name ) || '', suffix, options
		)
	}
	function _stat(stat, label){
		var line = $('<p/>')
			,id = '_input_g' + _g.inputIndex
		_g.inputIndex++

		switch( stat ){
			case 'consum':
				$('<label for="'+id+'"/>').html( '燃料' ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'number',
						'consum.fuel',
						id,
						d.consum.fuel
					).appendTo(line)

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<label for="'+id+'"/>').html( '弹药' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'consum.ammo',
						id,
						d.consum.ammo
					).appendTo(line)
				break;
			case 'speed':
				var value = d.stat[stat]

				$('<label for="'+id+'"/>').html( label ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'select',
						'stat.'+stat,
						id,
						[
							{
								'value': 	'5',
								'title': 	'低速'
							},
							{
								'value': 	'10',
								'title': 	'高速'
							}
						],
						{
							'default': 	value
						}
					).appendTo(line)
				$('<label for="'+id+'"/>').html( '当前值: ' + value ).appendTo(line)
				break;
			case 'range':
				var value = d.stat[stat]

				$('<label for="'+id+'"/>').html( label ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'select',
						'stat.'+stat,
						id,
						[
							{
								'value': 	'1',
								'title': 	'短'
							},
							{
								'value': 	'2',
								'title': 	'中'
							},
							{
								'value': 	'3',
								'title': 	'长'
							},
							{
								'value': 	'4',
								'title': 	'超长'
							}
						],
						{
							'default': 	value
						}
					).appendTo(line)
				$('<label for="'+id+'"/>').html( '当前值: ' + value ).appendTo(line)
				break;
			default:
				var value = d.stat[stat]

				$('<label for="'+id+'"/>').html( label ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'number',
						'stat.'+stat,
						id,
						value
					).appendTo(line)

				if( stat == 'carry' )
					input.prop('readonly', true)

				if( stat == 'carry' ){
					$('<label for="'+id+'"/>').html( '在“装备”页修改' ).appendTo(line)
				}else{
					id = '_input_g' + _g.inputIndex
					_g.inputIndex++
					$('<label for="'+id+'"/>').html( '最大' ).appendTo(line)
					_frame.app_main.page['ships'].gen_input(
							'number',
							'stat.'+stat+'_max',
							id,
							d.stat[stat+'_max']
						).appendTo(line)
				}
				/*
				if( typeof d.stat[stat+'_max'] != 'undefined' ){
					id = '_input_g' + _g.inputIndex
					_g.inputIndex++
					$('<label for="'+id+'"/>').html( '最大' ).appendTo(line)
					_frame.app_main.page['ships'].gen_input(
							'number',
							'stat.'+stat+'_max',
							id,
							d.stat[stat+'_max']
						).appendTo(line)
				}else if( typeof d.stat[stat+'_married'] != 'undefined' ){
					id = '_input_g' + _g.inputIndex
					_g.inputIndex++
					$('<label for="'+id+'"/>').html( '婚后' ).appendTo(line)
					_frame.app_main.page['ships'].gen_input(
							'text',
							'stat.'+stat+'_married',
							id,
							d.stat[stat+'_married']
						).appendTo(line)
				}else if( stat == 'carry' ){
					$('<label for="'+id+'"/>').html( '在“装备”页修改' ).appendTo(line)
				}
				*/
				break;
		}

		return line
	}
	function _slot(no, carry, equip){
		var line = $('<p/>')
			,id = '_input_g' + _g.inputIndex
		_g.inputIndex++

		$('<label for="'+id+'"/>').html( '#<span>' + no + '</span> 搭载' ).appendTo(line)
		_frame.app_main.page['ships'].gen_input(
				'number',
				'slot',
				id,
				carry
			).on({
				'change, input': function(){
					var total = 0
					details_slot.find('input[name="slot"]').each(function(){
						total+= parseInt( $(this).val() )
					})
				}
			}).appendTo(line)

		id = '_input_g' + _g.inputIndex
		_g.inputIndex++
		$('<label for="'+id+'"/>').html( '初始装备' ).appendTo(line)
		_comp.selector_equipment(
				'equip',
				'',
				equip
			).appendTo(line)
		/*
		_frame.app_main.page['ships'].gen_input(
				'number',
				'equip',
				id,
				equip,
				{
					'notRequired': true
				}
			).appendTo(line)*/

		// 删除本行搭载信息
		$('<button type="button" class="delete"/>').html('&times;').on('click', function(){
			line.remove()
			details_slot.find('input[name="slot"]').each(function(index){
				$(this).parent().find('label span').eq(0).html( (index+1) )
			})
		}).appendTo(line)

		return line
	}
	function _link(no, name, url){
		var line = $('<p/>')
			,id = '_input_g' + _g.inputIndex
		_g.inputIndex++

		$('<label for="'+id+'"/>').appendTo(line)
		//$('<label for="'+id+'"/>').html( '#<span>' + no + '</span>' ).appendTo(line)
		_frame.app_main.page['ships'].gen_input(
				'text',
				'link_name',
				id,
				name,
				{'notRequired': true}
			).appendTo(line)

		id = '_input_g' + _g.inputIndex
		_g.inputIndex++
		$('<label for="'+id+'"/>').html( 'URL' ).appendTo(line)
		_frame.app_main.page['ships'].gen_input(
				'text',
				'link_url',
				id,
				url,
				{'notRequired': true}
			).appendTo(line)

		// 删除本行搭载信息
		/*
		$('<button type="button" class="delete"/>').html('&times;').on('click', function(){
			line.remove()
			details_misc.find('input[name="link_name"]').each(function(index){
				$(this).parent().find('label span').eq(0).html( (index+1) )
			})
		}).appendTo(line)
		*/

		return line
	}
	function _series(stat, extra_illust_no){
		var line = $('<p/>')
			,id = '_input_g' + _g.inputIndex
		_g.inputIndex++

		switch( stat ){
			case 'remodel':
				$('<label for="'+id+'" class="remodel"/>').html( '改造前ID' ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'number',
						'series.remodel_prev',
						id,
						d_series.remodel_prev || null,
						{'notRequired': true}
					).appendTo(line)

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<label for="'+id+'"/>').html( '等级' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'series.remodel_prev_lvl',
						id,
						d_series.remodel_prev_lvl || null,
						{'notRequired': true}
					).appendTo(line)

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				_frame.app_main.page['ships'].gen_input(
						'checkbox',
						'series.remodel_prev_blueprint',
						id,
						d_series.remodel_prev_blueprint || false,
						{'notRequired': true}
					).appendTo(line)
				$('<label for="'+id+'"/>').html( '蓝图' ).appendTo(line)

				var line2 = $('<p/>')

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<label for="'+id+'" class="remodel"/>').html( '改造后ID' ).appendTo(line2)
				var input = _frame.app_main.page['ships'].gen_input(
						'number',
						'series.remodel_next',
						id,
						d_series.remodel_next || null,
						{'notRequired': true}
					).appendTo(line2)

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<label for="'+id+'"/>').html( '等级' ).appendTo(line2)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'series.remodel_next_lvl',
						id,
						d_series.remodel_next_lvl || null,
						{'notRequired': true}
					).appendTo(line2)

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				_frame.app_main.page['ships'].gen_input(
						'checkbox',
						'series.remodel_next_blueprint',
						id,
						d_series.remodel_next_blueprint || false,
						{'notRequired': true}
					).appendTo(line2)
				$('<label for="'+id+'"/>').html( '蓝图' ).appendTo(line2)

				// 基础等级
					id = '_input_g' + _g.inputIndex
					_g.inputIndex++
					var input = _frame.app_main.page['ships'].gen_input(
							'hidden',
							'base_lvl',
							id,
							d_series.remodel_prev_lvl || 1,
							{'notRequired': true}
						).appendTo(line2)

				line = line.add(line2)
				break;
			case 'illust_delete':
				_frame.app_main.page['ships'].gen_input(
						'checkbox',
						'series.illust_delete',
						id,
						d_series.illust_delete || false,
						{'notRequired': true}
					).addClass('delete_illust').appendTo(line)
				$('<label for="'+id+'"/>').html( '删除该舰娘图鉴大图' ).appendTo(line)
				break;
			case 'illust_extra':
				var no = extra_illust_no ? ( parseInt(extra_illust_no) + 1) : 1
				$('<label for="'+id+'" class="extra_illust"/>').html( '额外图鉴#' + no + ' extra_' ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'number',
						'series.illust_extra',
						id,
						d_series.illust_extra[extra_illust_no ? extra_illust_no : 0] || null,
						{'notRequired': true}
					).appendTo(line)
				break;
		}

		return line
	}

	var form = $('<form class="shipinfo new"/>')

		,base = $('<div class="base"/>').appendTo(form)
		,details = $('<div class="tabview"/>').appendTo(form)

		// 如果有 _id 则表明已存在数据，当前为编辑操作，否则为新建操作
		,_id = d._id ? $('<input type="hidden"/>').val( d._id ) : null

		,details_stat = $('<section data-tabname="属性"/>').appendTo(details)
		,details_slot = $('<section data-tabname="装备"/>').appendTo(details)
		,details_misc = $('<section data-tabname="其他"/>').appendTo(details)
		,details_series = $('<section data-tabname="系列"/>').appendTo(details)
		,details_additional_equip_types = $('<section data-tabname="额外装备类型"/>').appendTo(details)

	// 标准图鉴
		,base_image = $('<div class="image"/>').css('background-image', 'url(../pics/ships/'+d['id']+'/2.png)').appendTo(base)

	// 基础信息
		_input('id', 'ID', null, {'required': true}).appendTo(base)
		_input('no', '图鉴ID', null, {'required': true}).appendTo(base)
		var h4 = $('<h4/>').html('舰娘名').appendTo(base)
		var checkbox_id = '_input_g' + _g.inputIndex
		_g.inputIndex++
		var _checkbox = _frame.app_main.page['ships'].gen_input(
			'checkbox',
			null,
			checkbox_id,
			false,
			{
				'onchange': function( checkbox ){
					if( checkbox.prop('checked') ){
						base.find('input[name^="name."]').not('input[name="name.suffix"]').prop('required', false)
						base.find('select[name="name.suffix"]').prop('required', true)
					}else{
						base.find('input[name^="name."]').not('input[name="name.suffix"]').prop('required', true)
						base.find('select[name="name.suffix"]').prop('required', false)
					}
				}
			}
		).insertBefore(h4)
		$('<label for="'+checkbox_id+'" class="name_suffix"/>').html('仅后缀').insertBefore(_checkbox)
		_input('name.ja_jp', '<small>日</small>').appendTo(base)
		_input('name.ja_kana', '<small>日假名</small>').appendTo(base)
		_input('name.ja_romaji', '<small>罗马音</small>').appendTo(base)
		_input('name.zh_cn', '<small>简中</small>').appendTo(base)
			var base_suffix = _frame.app_main.page['ships'].gen_form_line(
					'select',
					'name.suffix',
					'后缀名',
					[],
					null,
					{
						'notRequired': true
					}
				).appendTo(base)
			_db.ship_namesuffix.find({}).sort({ 'id': 1 }).exec(function(err, docs){
				if( !err ){
					var suffix = []
						,sel = base_suffix.find('select')
					for(var i in docs ){
						suffix.push({
							//'value': 	docs[i]['_id'],
							'value': 	docs[i]['id'],
							'title': 	docs[i]['zh_cn']
						})
					}
					// 实时载入舰种数据
					_frame.app_main.page['ships'].gen_input(
						'select',
						sel.attr('name'),
						sel.attr('id'),
						suffix,
						{
							'default': 	d['name']['suffix'],
							'notRequired': true,
							'new': function( select ){
								console.log( 'NEW SHIP SUFFIX', select )
							},
						}).insertBefore(sel)
					sel.remove()
				}
			})


	// 属性
		_stat('fire', '火力').appendTo(details_stat)
		_stat('torpedo', '雷装').appendTo(details_stat)
		_stat('aa', '对空').appendTo(details_stat)
		_stat('asw', '对潜').appendTo(details_stat)

		_stat('hp', '耐久').appendTo(details_stat)
		_stat('armor', '装甲').appendTo(details_stat)
		_stat('evasion', '回避').appendTo(details_stat)
		_stat('carry', '搭载').appendTo(details_stat)

		_stat('speed', '速力').appendTo(details_stat)
		_stat('range', '射程').appendTo(details_stat)
		_stat('los', '索敌').appendTo(details_stat)
		_stat('luck', '　运').appendTo(details_stat)

		$('<h4/>').html('消耗').appendTo(details_stat)
		_stat('consum').appendTo(details_stat)


	// 装备
		for(var i=0; i<Math.max(d['slot'].length, d['equip'].length); i++ ){
			_slot(
				(i+1),
				d['slot'][i] || 0,
				d['equip'][i] || null
			).appendTo(details_slot)
		}
		var btn_add_slot = $('<button class="add" type="button"/>').on('click', function(){
			_slot(
				details_slot.find('input[name="slot"]').length + 1,
				0,
				null
			).insertBefore(btn_add_slot)
		}).html('添加栏位').appendTo(details_slot)


	// 其他
		// 声优
			var _misc_cv = _frame.app_main.page['ships'].gen_form_line(
					'select',
					'rels.cv',
					'声优',
					[]
				).appendTo(details_misc)
			_db['entities'].find({}).sort({ 'id': 1 }).exec(function(err, docs){
				if( !err ){
					var types = []
						,sel = _misc_cv.find('select')
					for(var i in docs ){
						types.push({
							//'value': 	docs[i]['_id'],
							'value': 	docs[i]['id'],
							'title': 	docs[i]['name']['zh_cn']
						})
					}
					// 实时载入舰种数据
					_frame.app_main.page['ships'].gen_input(
						'select',
						sel.attr('name'),
						sel.attr('id'),
						types,
						{
							'default': d['rels']['cv'],
							'new': function( select ){
								console.log( 'NEW ENTITY', select )
							}
						}).insertBefore(sel)
					sel.remove()
				}
			})
		// 画师
			var _misc_illustrator = _frame.app_main.page['ships'].gen_form_line(
					'select',
					'rels.illustrator',
					'画师',
					[]
				).appendTo(details_misc)
			_db['entities'].find({}).sort({ 'id': 1 }).exec(function(err, docs){
				if( !err ){
					var types = []
						,sel = _misc_illustrator.find('select')
					for(var i in docs ){
						types.push({
							//'value': 	docs[i]['_id'],
							'value': 	docs[i]['id'],
							'title': 	docs[i]['name']['zh_cn']
						})
					}
					// 实时载入舰种数据
					_frame.app_main.page['ships'].gen_input(
						'select',
						sel.attr('name'),
						sel.attr('id'),
						types,
						{
							'default': d['rels']['illustrator'],
							'new': function( select ){
								console.log( 'NEW ENTITY', select )
							}
						}).insertBefore(sel)
					sel.remove()
				}
			})
		$('<h4/>').html('舰种&舰级').appendTo(details_misc)
		// 舰种
			var base_type = _frame.app_main.page['ships'].gen_form_line(
					'select',
					'type',
					'舰种',
					[]
				).appendTo(details_misc)
			_db.ship_types.find({}).sort({ 'code': 1, 'full': 1 }).exec(function(err, docs){
				if( !err ){
					var types = []
						,sel = base_type.find('select')
					for(var i in docs ){
						types.push({
							//'value': 	docs[i]['_id'],
							'value': 	docs[i]['id'],
							'title': 	'[' + docs[i]['code'] + '] ' + docs[i]['full_zh']
						})
					}
					// 实时载入舰种数据
					_frame.app_main.page['ships'].gen_input(
						'select',
						sel.attr('name'),
						sel.attr('id'),
						types,
						{
							'default': d['type'],
							'new': function( select ){
								console.log( 'NEW SHIP TYPE', select )
							},
							// 改变舰种后，实时读取舰级数据
							'onchange': function( select ){
								base_class_select.html('<option value=""/>...</option>')
								_db.ship_classes.find({
									'ship_type_id': 	parseInt( select.val() )
								}, function(err_classes, docs_classes){
									if( !err_classes ){
										var classes = []
											,_sel = base_class_select
										for(var j in docs_classes ){
											classes.push({
												//'value': 	docs_classes[j]['_id'],
												'value': 	docs_classes[j]['id'],
												'title': 	docs_classes[j]['name_zh'] + '级'
											})
										}
										if( !docs_classes || !docs_classes.length ){
											classes.push({
												'value': 	'',
												'title': 	''
											})
										}
										base_class_select = _frame.app_main.page['ships'].gen_input(
											'select',
											_sel.attr('name'),
											_sel.attr('id'),
											classes,
											{
												'new': function( select ){
													console.log( 'NEW SHIP CLASS', select )
												}
											}).insertBefore(_sel)
										_sel.remove()

										if( d['type'] && base_type.find('select').val() == d['type'] ){
											base_class_select.val( d['class'] )
										}
									}
								})
							}
						}).insertBefore(sel)
					sel.remove()
				}
			})
		// 舰级
			var base_class = _frame.app_main.page['ships'].gen_form_line(
					'select',
					'class',
					'舰级',
					[]
				).appendTo(details_misc)
			var base_class_select = base_class.find('select')
			_input('class_no', '编号', '号舰').appendTo(details_misc)
		// 链接
			_form.section_order(
				'链接',
				function(data, index){
					return _link(index + 1, data['name'] || null, data['url'] || null)
				},
				$.extend(true,
					[
						{
							'name': '日文WIKI',
							'url': 	null
						},
						{
							'name': '英文WIKI',
							'url': 	null
						}
					],
					d['links']
				)
			).appendTo(details_misc)
			/*
			$('<h4/>').html('链接').appendTo(details_misc)
			var link_defaults = [
				'日文WIKI',
				'英文WIKI'
			]
				,_links_exists = parseInt( d['links'] ? d['links'].length : 0 )
			for( var i in d['links'] ){
				_link((parseInt(i)+1), d['links'][i]['name'], d['links'][i]['url']).appendTo(details_misc)
				if( $.inArray(d['links'][i]['name'], link_defaults) > -1 )
					link_defaults.splice( $.inArray(d['links'][i]['name'], link_defaults), 1 )
			}
			for( var i in link_defaults ){
				_link((_links_exists + parseInt(i) +1), link_defaults[i], '').appendTo(details_misc)
			}
			var btn_add_link = $('<button class="add" type="button"/>').on('click', function(){
				_link(
					details_misc.find('input[name="link_name"]').length + 1,
					'',
					''
				).insertBefore(btn_add_link)
			}).html('添加链接').appendTo(details_misc)
			*/


	// 系列
		var d_series = {
				'illust_extra': []
			}
			,d_series_true = null
			,d_series_true_index = null
		_db.ship_series.find({ 'id': d['series'] }).exec(function(err, docs){
			if( !err && docs && docs.length ){
				d_series_true = docs[0]
				for( var i in docs[0].ships ){
					var index = parseInt(i)
					if( d['id'] == docs[0].ships[index]['id'] ){
						d_series_true_index = index
						if( index>0 ){
							d_series.remodel_prev = docs[0].ships[index-1]['id'] || null
							d_series.remodel_prev_lvl = docs[0].ships[index-1]['next_lvl'] || null
							d_series.remodel_prev_blueprint = docs[0].ships[index-1]['next_blueprint'] || false
						}
						if( docs[0].ships[index+1] ){
							d_series.remodel_next = docs[0].ships[index+1]['id'] || null
							d.remodel_next = d.remodel_next || (docs[0].ships[index+1]['id'] || null)
						}
						d_series.remodel_next_lvl = docs[0].ships[index]['next_lvl'] || null
						if( d.remodel.next ){
							d_series.remodel_next = parseInt(d.remodel.next) || null
						}
						if( d.remodel.next_lvl ){
							d_series.remodel_next_lvl = parseInt(d.remodel.next_lvl) || null
						}
						d_series.remodel_next_blueprint = docs[0].ships[index]['next_blueprint'] || false
						d_series.illust_delete = docs[0].ships[index]['illust_delete'] || false
						d_series.illust_extra = docs[0].ships[index]['illust_extra'] || []
						break
					}
				}
				if( !d_series.remodel_prev ){
					d_series.remodel_prev = parseInt(d.remodel.prev) || null
					d_series.remodel_prev_lvl = parseInt(d.remodel.prev_lvl) || null
					d_series.remodel_prev_blueprint = d.remodel.prev_blueprint || false
				}
			}else{
				d_series.remodel_prev = parseInt(d.remodel.prev) || null
				d_series.remodel_prev_lvl = parseInt(d.remodel.prev_lvl) || null
				d_series.remodel_prev_blueprint = d.remodel.prev_blueprint || false
				d_series.remodel_next = parseInt(d.remodel.next) || null
				d_series.remodel_next_lvl = parseInt(d.remodel.next_lvl) || null
				d_series.remodel_next_blueprint = d.remodel.next_blueprint || false
				d.remodel_next = d.remodel_next || ( parseInt(d.remodel.next) || null )
			}

			$('<h4/>').html('改造').appendTo(details_series)
				_series('remodel').appendTo(details_series)

			$('<h4/>').html('图鉴').appendTo(details_series)
				_series('illust_delete').appendTo(details_series)
				var _illust_extra = d_series.illust_extra || [1]
				if( !_illust_extra.length )
					_illust_extra = [1]
				for( var i in _illust_extra ){
					_series(
						'illust_extra',
						i
					).appendTo(details_series)
				}
				var btn_add_extraillust = $('<button class="add" type="button"/>').on('click', function(){
					_series(
						'illust_extra',
						details_series.find('input[name="series.illust_extra"]').length
					).insertBefore(btn_add_extraillust)
				}).html('添加额外图鉴').appendTo(details_series)

			d.remodel_next = d.remodel_next || d_series.remodel_next
			if( d.remodel_next )
				$('<input type="hidden" name="remodel_next"/>').val(d.remodel_next).appendTo( details_series )
		})


	// 额外装备类型
		_form.create_item_types('additional_item_types', d['additional_item_types'] || []).appendTo( details_additional_equip_types )



	// 提交等按钮
		var line = $('<p class="actions"/>').appendTo( form )
		$('<button type="submit"/>').html( d._id ? '编辑' : '入库').appendTo(line)


	// 提交函数
		form.on('submit', function(e){
			var function_queue = []

				,ship_next = null
				,ship_id_next = null
				,series_id = null
				,delete_illust = false

				,rels_to_parse = [
					'cv',
					'illustrator'
				]
			function function_queue_run(){
				if( !function_queue.length )
					return true
				function_queue[0]()
				function_queue.shift()
				function_queue_run()
			}
			function _parse_db_series(){
				if( data['series']['remodel_next'] ){
					ship_id_next = data['series']['remodel_next']
					ship_next = {
						'prev': 			data['id'],
						'prev_lvl': 		data['series']['remodel_next_lvl'],
						'prev_blueprint': 	data['series']['remodel_next_blueprint']
					}
				}
				//d_series_true
				//d_series_true_index
				// 如果存在 d_series_true，表示已有 series，则更新操作
				// 如果不存在，优先检查 remodel_prev 和 remodel_next 是否有 series，如果有，则更新操作
				// 否则则为新建操作
				if( !d_series_true && ( data['series']['remodel_prev'] || data['series']['remodel_next'] ) ){
					series_id = null
					function _do_check( check_id, is_last ){
						_db.ships.find({'id': check_id}, function(err, docs){
							if( !err && docs && docs.length )
								series_id = docs[0].series

							if( !is_last && !series_id && data['series']['remodel_next'] ){
								console.log( series_id )
								_do_check( data['series']['remodel_next'], true )
							}else{
								console.log( series_id )
								_db.ship_series.find({ 'id': series_id }).exec(function(err, docs){
									if( !err && docs && docs.length ){
										d_series_true = docs[0]
										for( var i in docs[0].ships ){
											var index = parseInt(i)
											if( d['id'] == docs[0].ships[index]['id'] ){
												d_series_true_index = index
												if( index>0 ){
													data['series'].remodel_prev = docs[0].ships[index-1]['id'] || null
													data['series'].remodel_prev_lvl = docs[0].ships[index-1]['next_lvl'] || null
													data['series'].remodel_prev_blueprint = docs[0].ships[index-1]['next_blueprint'] || false
												}
												if( docs[0].ships[index+1] ){
													data['series'].remodel_next = docs[0].ships[index+1]['id'] || null
													data['remodel_next'] = docs[0].ships[index+1]['id'] || null
												}
												data['series'].remodel_next_lvl = docs[0].ships[index]['next_lvl'] || null
												if( d.remodel.next ){
													data['series'].remodel_next = parseInt(d.remodel.next) || null
												}
												if( d.remodel.next_lvl ){
													data['series'].remodel_next_lvl = parseInt(d.remodel.next_lvl) || null
												}
												data['series'].remodel_next_blueprint = docs[0].ships[index]['next_blueprint'] || false
												data['series'].illust_delete = docs[0].ships[index]['illust_delete'] || false
												data['series'].illust_extra = docs[0].ships[index]['illust_extra'] || []
												break
											}
										}
									}

									_do_parse()
								})
							}
						})
					}

					if( data['series']['remodel_prev'] ){
						_do_check( data['series']['remodel_prev'] )
					}else if( data['series']['remodel_next'] ){
						_do_check( data['series']['remodel_next'], true )
					}else{
						_do_parse()
					}

				}else{
					_do_parse()
				}


				function _do_parse(){
					if( d_series_true ){
						if( !d_series_true_index && d_series_true_index !== 0 )
							d_series_true_index = d_series_true.ships.length
						console.log( d_series_true, d_series_true_index, data )
						var _length = d_series_true.ships.length
							,_prev 	= d_series_true_index > 0 ? d_series_true.ships[ d_series_true_index - 1 ] : null
							,_next 	= d_series_true_index < _length - 1 ? d_series_true.ships[ d_series_true_index + 1 ] : null

						if( _prev ){
							_prev['id'] = data['series']['remodel_prev']
							_prev['next_lvl'] = data['series']['remodel_prev_lvl']
							_prev['next_blueprint'] = data['series']['remodel_prev_blueprint']
						}

						if( !d_series_true.ships[ d_series_true_index ] )
							d_series_true.ships[ d_series_true_index ] = {
								'id': 	data['id']
							}

						d_series_true.ships[ d_series_true_index ]['next_lvl'] = data['series']['remodel_next_lvl']
						d_series_true.ships[ d_series_true_index ]['next_blueprint'] = data['series']['remodel_next_blueprint']
						d_series_true.ships[ d_series_true_index ]['illust_delete'] = data['series']['illust_delete']
						d_series_true.ships[ d_series_true_index ]['illust_extra'] = data['series']['illust_extra']

						if( _next ){
							_next['id'] = data['series']['remodel_next']
						}else if( data['series']['remodel_next'] ){
							d_series_true.ships.push({
								'id': 	data['series']['remodel_next']
							})
						}

						data['series'] = d_series_true['id']
						series_id = d_series_true['id']
						_db.ship_series.update({
							'_id': 	d_series_true['_id']
						}, {
							$set: d_series_true
						}, {}, function (err, numReplaced) {
							console.log('SERIES UPDATE', d_series_true)
							start_db_operate()
						});
					}else{
						d_series_true = {
							'ships': []
						}
						if( data['series'].remodel_prev ){
							d_series_true.ships.push({
								'id': 				data['series']['remodel_prev'],
								'next_lvl': 		data['series']['remodel_prev_lvl'],
								'next_blueprint': 	data['series']['remodel_prev_blueprint']
							})
						}
						d_series_true.ships.push({
							'id': 				data['id'],
							'next_lvl': 		data['series']['remodel_next_lvl'],
							'next_blueprint': 	data['series']['remodel_next_blueprint'],
							'illust_delete': 	data['series']['illust_delete'],
							'illust_extra': 	data['series']['illust_extra']
						})

						if( data['series'].remodel_next ){
							d_series_true.ships.push({
								'id': 				data['series']['remodel_next']
							})
						}
						_db.ship_series.count({}, function(err, count){
							d_series_true['id'] = parseInt(count) + 1
							_db.ship_series.insert(
								d_series_true,
								function(err, newDoc){
									console.log('SERIES INSERT', newDoc)
									data['series'] = newDoc['id']
									series_id = newDoc['id']
									start_db_operate()
								}
							);
						})
					}
				}
			}
			function _parse_db_rels(){
				// data['rels']['cv']
				function parse_rels(){
					if( rels_to_parse.length ){
						_db['entities'].find({'id': data['rels'][rels_to_parse[0]] || -1}, function(err, docs){
							if( !err && docs && docs.length ){
								var entity_update_set_rels = docs[0]['rels'] || {}
								if( typeof entity_update_set_rels[rels_to_parse[0]] == 'undefined' )
									entity_update_set_rels[rels_to_parse[0]] = []

								if( $.inArray( data['id'], entity_update_set_rels[rels_to_parse[0]] ) < 0 )
									entity_update_set_rels[rels_to_parse[0]].push( data['id'] )

								var entity_update_set = {
									'rels': entity_update_set_rels
								}

								_db['entities'].update({
									'_id': 		docs[0]._id
								},{
									$set: entity_update_set
								},{}, function(err, numReplaced){
									console.log('ENTITY UPDATE COMPLETE', numReplaced, entity_update_set)
									rels_to_parse.shift()
									parse_rels()
								})
							}else{
								rels_to_parse.shift()
								parse_rels()
							}
						})
					}else{
						_parse_db_series()
					}
				}
				parse_rels()
			}
			function _delete_illust(){
				if( delete_illust ){
					var files = [
						'8.png',
						'9.png',
						'10.png'
					]
					function _delete(){
						node.fs.unlink(_g.path.pics.ships + '/' + data['id'] + '/' + files[0], function(err){
							if( files.length ){
								files.shift()
								_delete()
							}else{
								//function_queue_run()
								_parse_db_rels()
							}
						})
					}
					_delete()
				}else{
					_parse_db_rels()
				}
			}
			function start_db_operate(){
				if( _id ){
					// 存在 _id，当前为更新操作
					data.time_modified = _g.timeNow()
					console.log( 'EDIT', data )
					_db.ships.update({
						'_id': 		d._id
					},{
						$set: data
					},{}, function(err, numReplaced){
						console.log('UPDATE COMPLETE', numReplaced, data)
						data._id = d._id
						// 在已入库表格中更改原有数据行
							var oldTr = _frame.app_main.page['ships'].section['已入库'].dom.section
										//_frame.app_main.page['ships'].section['已入库'].dom.table
											.find('tr[data-shipId="'+data['id']+'"]')
							//_frame.app_main.page['ships'].section['已入库'].append_table_tr( data )
							_frame.app_main.page['ships'].section['已入库'].dom.section.data('shiplist').append_ship( data )
								.insertBefore( oldTr )
							oldTr.remove()
							_frame.modal.hide()
					})
				}else{
					// 不存在 _id，当前为新建操作
					data.time_created = _g.timeNow()
					// 删除JSON数据
						node.fs.unlink(_g.path.fetched.ships + '/' + data['id'] + '.json', function(err){
							_db.ships.insert(data, function(err, newDoc){
								console.log('INSERT COMPLETE', newDoc)
								// 删除“未入库”表格中对应的行
									try{
										_frame.app_main.page['ships'].section['未入库'].dom.table
											.find('tr[data-shipId="'+data['id']+'"]').remove()
									}catch(e){}
								// 在“已入库”表格开头加入行
									_frame.app_main.page['ships'].section['已入库'].dom.section.data('shiplist').append_ship( newDoc )
									//_frame.app_main.page['ships'].section['已入库'].append_table_tr( newDoc )
								_frame.modal.hide()

								// 立即处理改造后舰娘
									if( ship_id_next ){
										try{
											_frame.modal.resetContent()
											_frame.app_main.page['ships'].section['未入库'].dom.table
												.find('tr[data-shipId="'+ship_id_next+'"]').trigger('click',[{
													'name': {
														'ja_romaji': 	newDoc['name']['ja_romaji'],
														'zh_cn': 		newDoc['name']['zh_cn']
													},
													'rels': {
														'cv': 			newDoc['rels']['cv'],
														'illustrator': 	newDoc['rels']['illustrator'],
													},
													'series': 		series_id,
													'type': 		newDoc['type'],
													'class': 		newDoc['class'],
													'class_no': 	newDoc['class_no']
												}])
										}catch(e){

										}
									}
							})
						})
				}
			}

			e.preventDefault()
				var data = {}

			// 处理所有数据，将带有 . 的数据变为 object 元素
				data = $(this).serializeObject()
				data['class_no'] = parseInt( data['class_no'] )
				delete_illust = data['series']['illust_delete']
				if( !data['series']['illust_extra'].push )
					data['series']['illust_extra'] = [data['series']['illust_extra']]

				if( !data['slot'] )
					data['slot'] = []
				else if( typeof data['slot'] != 'object' )
					data['slot'] = [data['slot']]

				if( !data['equip'] )
					data['equip'] = []
				else if( typeof data['equip'] != 'object' )
					data['equip'] = [data['equip']]

				if( typeof data['additional_item_types'] != 'object' && typeof data['additional_item_types'] != 'undefined' )
					data['additional_item_types'] = [data['additional_item_types']]
				data['additional_item_types'] = data['additional_item_types'] || []

				console.log( data, data['slot'], data['equip'] )

			// 名称
				if( !data['name']['suffix'] )
					data['name']['suffix'] = null
				// 存在后缀时，删除其他名称
				/*
					if( data['name']['suffix'] ){
						for( var i in data['name'] ){
							if( i != 'suffix' )
								delete data['name'][i]
						}
					}*/

			// 链接
				data['links'] = []
				details_misc.find('input[name="link_name"]').each(function(index){
					var name = $(this)
						,line = $(this).parent()
						,url = line.find('input[name="link_url"]').val()
					name = name.val()

					data['links'].push({
						'name': name,
						'url': 	url
					})
				})
				data.link_name = null
				data.link_url = null
				delete data.link_name
				delete data.link_url

			// 搭载
				var carry_num = 0
				for(var i in data['slot']){
					carry_num+= parseInt( data['slot'][i] )
				}
				data['stat']['carry'] = carry_num

			// 系列
				//if( data.series.illust_delete ){
				//	function_queue.push(
				//		_delete_illust
				//	)
				//}
				//function_queue.push(
				//	_parse_db_series
				//)

			// 写入数据
				//function_queue.push(
				//	start_db_operate
				//)

			//function_queue_run()

			_delete_illust()

		})


	_frame.modal.show(
		form,
		d.name.ja_jp || '未入库舰娘',
		{
			'classname': 	'infos_form'
		}
	)
}






_frame.app_main.page['ships'].gen_form_new_ship_type = function( callback ){
	callback = callback || function(){}
	var self = _frame.app_main.page['ships'].section['舰种&舰级']
		,form = $('<form class="new_ship_type"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()

					// 获取当前共有多少舰种，确定新建舰种的数字ID
					// 之后插入数据
						_db.ship_types.count({}, function(err, count){
							data['id'] = parseInt(count) + 1
							_db.ship_types.insert(
								data,
								callback
							);
						})
				})
	self.field_input_text('code', '舰种简称').appendTo(form)
	self.field_input_text('code_game', '舰种简称 (游戏中)').appendTo(form)
	self.field_input_text('full', '舰种全称').appendTo(form)
	self.field_input_text('full_game', '舰种全称 (游戏中)').appendTo(form)
	self.field_input_text('full_zh', '舰种全称 (中文)').appendTo(form)

	var input_id = '_input_g' + _g.inputIndex
	_g.inputIndex++
	$('<input type="checkbox" name="donotcompare" id="'+input_id+'">')
		.prop('checked', false)
		.appendTo( form )
	$('<label for="'+input_id+'"/>').html('不参与属性表对比').appendTo(form)

	self.field_actions().appendTo(form)

	return form
}

_frame.app_main.page['ships'].gen_form_new_ship_class = function( callback ){
	callback = callback || function(){}

	var self = _frame.app_main.page['ships'].section['舰种&舰级']
		,form = $('<form class="ship_class loading"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()

					// 获取当前共有多少舰级，确定新建舰级的数字ID
					// 之后插入数据
						_db.ship_classes.count({}, function(err, count){
							data['id'] = parseInt(count) + 1
							_db.ship_classes.insert(
								data,
								callback
							);
						})
				})

	self.field_input_text('name_game', '舰级名 (游戏中)', null, '型').appendTo(form)
	self.field_input_text('name_zh', '舰级名 (中文)', null, '级').appendTo(form)

	var line = $('<p/>').appendTo(form)
		,select = $('<select name="ship_type_id" required/>').html('<option value=""></option>').appendTo(form)

	_db.ship_types.find({}).sort({ 'code': 1, 'full': 1 }).exec(function(err, docs){
		if( !err ){
			for(var i in docs ){
				var _data = docs[i]
				$('<option/>',{
					'value': 	_data['id'],
					'html': 	'[' + _data['code'] + '] ' + _data['full_zh']
				}).appendTo(select)
			}
			form.removeClass('loading')
		}
	})

	self.field_actions().appendTo(form)

	return form
}

_frame.app_main.page['ships'].gen_form_new_ship_suffix = function( callback, data_edit, callback_remove ){
	callback = callback || function(){}
	let is_edit = (data_edit)
	var self = _frame.app_main.page['ships'].section['舰种&舰级']
		,form = $('<form class="ship_suffix' +(is_edit ? ' loading' : '')+ '"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()

					if( is_edit ){
						// 编辑操作
						_db.ship_namesuffix.update({
							'_id': 	data_edit['_id']
						}, {
							$set: data
						}, {}, function (err, numReplaced) {
							callback( data )
							_frame.modal.hide()
						});
					}else{
						// 新建操作
						// 获取当前总数，确定数字ID
						// 之后插入数据
							_db.ship_namesuffix.count({}, function(err, count){
								data['id'] = parseInt(count) + 1
								_db.ship_namesuffix.insert(
									data,
									callback
								);
							})
					}
				})
	self.field_input_text('ja_jp', '日', is_edit ? data_edit['ja_jp'] : null).appendTo(form)
	self.field_input_text('ja_romaji', '罗马音', is_edit ? data_edit['ja_romaji'] : null).appendTo(form)
	self.field_input_text('zh_cn', '简中', is_edit ? data_edit['zh_cn'] : null).appendTo(form)

	self.field_actions(
		is_edit ? '更新' : null,
		callback_remove ? function(){
				_db.ship_namesuffix.remove({ _id: data_edit['_id'] }, {}, function (err, numRemoved) {
					callback_remove()
					_frame.modal.hide()
				});
			} : null
	).appendTo(form)

	return form
}

_frame.app_main.page['ships'].gen_form_new_ship_type_collection = function( callback, data_edit, callback_remove ){
	callback = callback || function(){}
	let is_edit = (data_edit)
	var types = is_edit ? data_edit['types'] : []
	var self = _frame.app_main.page['ships'].section['舰种&舰级']
		,form = $('<form class="ship_type_collection"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()
					if( typeof data['types'] != 'object' && typeof data['types'] != 'undefined' )
						data['types'] = [data['types']]

					if( is_edit ){
						// 编辑操作
						_db.ship_type_collections.update({
							'_id': 	data_edit['_id']
						}, {
							$set: data
						}, {}, function (err, numReplaced) {
							callback( data )
							_frame.modal.hide()
						});
					}else{
						// 新建操作
						// 获取当前总数，确定数字ID
						// 之后插入数据
							_db.ship_type_collections.count({}, function(err, count){
								data['id'] = parseInt(count) + 1
								_db.ship_type_collections.insert(
									data,
									callback
								);
							})
					}
				})

	self.field_input_text('name.zh_cn', '简中', is_edit ? data_edit['name']['zh_cn'] : null).appendTo(form)

	// 舰种信息
		_db.ship_types.find({}).sort({'id': 1}).exec(function(err, docs){
			for(var i in docs ){
				var type_id = parseInt(docs[i]['id'])
					,input_id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<input type="checkbox" name="types" value="'+type_id+'" id="'+input_id+'"/>')
					.prop('checked', ($.inArray(type_id, types) > -1) )
					.appendTo( form )
				$('<label for="'+input_id+'"/>').html(docs[i]['full_zh']).appendTo(form)
				$('<br/>').appendTo(form)
			}

			self.field_actions(
				is_edit ? '更新' : null,
				callback_remove ? function(){
						_db.ship_type_collections.remove({ _id: data_edit['_id'] }, {}, function (err, numRemoved) {
							callback_remove()
							_frame.modal.hide()
						});
					} : null
			).appendTo(form)
		})

	return form
}

_frame.app_main.page['ships'].gen_form_new_ship_type_order = function( callback, data_edit, callback_remove ){
	callback = callback || function(){}
	let is_edit = (data_edit)
	var types = is_edit ? data_edit['types'] : []
	var self = _frame.app_main.page['ships'].section['舰种&舰级']
		,form = $('<form class="ship_type_collection"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()
					if( typeof data['types'] != 'object' && typeof data['types'] != 'undefined' )
						data['types'] = [data['types']]

					if( is_edit ){
						// 编辑操作
						_db.ship_type_order.update({
							'_id': 	data_edit['_id']
						}, {
							$set: data
						}, {}, function (err, numReplaced) {
							callback( data )
							_frame.modal.hide()
						});
					}else{
						// 新建操作
						// 获取当前总数，确定数字ID
						// 之后插入数据
							_db.ship_type_order.count({}, function(err, count){
								data['id'] = parseInt(count) + 1
								_db.ship_type_order.insert(
									data,
									callback
								);
							})
					}
				})

	self.field_input_text('name.zh_cn', '简中', is_edit ? data_edit['name']['zh_cn'] : null).appendTo(form)

	var input_id = '_input_g' + _g.inputIndex
	_g.inputIndex++
	$('<input type="checkbox" name="donotcompare" id="'+input_id+'">')
		.prop('checked', is_edit ? data_edit['donotcompare'] : null)
		.appendTo( form )
	$('<label for="'+input_id+'"/>').html('不参与属性表对比').appendTo(form)
	$('<hr/>').appendTo(form)

	// 舰种信息
		_db.ship_types.find({}).sort({'id': 1}).exec(function(err, docs){
			for(var i in docs ){
				var type_id = parseInt(docs[i]['id'])
					,input_id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<input type="checkbox" name="types" value="'+type_id+'" id="'+input_id+'">')
					.prop('checked', ($.inArray(type_id, types) > -1) )
					.appendTo( form )
				$('<label for="'+input_id+'"/>').html(docs[i]['full_zh']).appendTo(form)
				$('<br/>').appendTo(form)
			}

			self.field_actions(
				is_edit ? '更新' : null,
				callback_remove ? function(){
						_db.ship_type_order.remove({ _id: data_edit['_id'] }, {}, function (err, numRemoved) {
							callback_remove()
							_frame.modal.hide()
						});
					} : null
			).appendTo(form)
		})

	return form
}

















_frame.app_main.page['ships'].init = function(page){
	page.find('section').on({
		'tabview-show': function(){
			var section = $(this)
				,name = section.data('tabname')

			if( !_frame.app_main.page['ships'].section[name] )
				_frame.app_main.page['ships'].section[name] = {}

			var _o = _frame.app_main.page['ships'].section[name]

			if( !_o.is_init && _o.init ){
				_o.init(section)
				_o.is_init = true
			}
			switch( name ){
				case '未入库':
					break;
			}
		}
	})
}









_frame.app_main.page['ships'].section['已入库'] = {
	'dom': {
	},

	'init': function(section){
		_frame.app_main.page['ships'].section['已入库'].dom.section = section
	}
}














_frame.app_main.page['ships'].section['未入库'] = {
	'data': 		[],
	'data_length': 	0,
	'dom': {},

	'append_table': function(section){
		var container = $('<div class="fixed-table-container"/>').appendTo(section)
			,inner = $('<div class="fixed-table-container-inner"/>').appendTo(container)
			,table = $('<table class="ships hashover hashover-column"/>').appendTo(inner)
		function gen_thead(arr){
			var thead = $('<thead/>')
				,tr = $('<tr/>').appendTo(thead)
			for(var i in arr){
				if( parseInt(i) ){
					$('<td/>').html('<div class="th-inner">'+arr[i]+'</div>').appendTo(tr)
				}else{
					$('<th/>').html('<div class="th-inner">'+arr[i]+'</div>').appendTo(tr)
				}
			}
			return thead
		}
		gen_thead([
				' ',
				//'ID',
				'火力',
				'雷装',
				'对空',
				'对潜',
				'耐久',
				'装甲',
				'回避',
				'搭载',
				'航速',
				'射程',
				'索敌',
				'运'
			]).appendTo(table)
		var tbody = $('<tbody/>').appendTo(table)
			,_index = 0

		function raw_ship_data_convert(d){
			var data = {
				'id': 	d['id'],
				'no': 	d['no'],
				'name': {
					'ja_jp': 	d['name'],
					'ja_kana': 	d['pron']
				},
				'stat': {
					'fire': 		d['fire'],
					'fire_max': 	d['max_fire'],
					'torpedo': 		d['torpedo'],
					'torpedo_max': 	d['max_torpedo'],
					'aa': 			d['aac'],
					'aa_max':		d['max_aac'],
					'asw': 			d['ass'],
					'asw_max':		d['max_ass'],

					'hp': 			d['hp'],
					'hp_max':		d['max_hp'],
					'armor': 		d['armor'],
					'armor_max':	d['max_armor'],
					'evasion': 		d['evasion'],
					'evasion_max':	d['max_evasion'],
					'carry': 		'',

					'speed':		d['speed'],
					'range':		d['range'],
					'los': 			d['seek'],
					'los_max':		d['max_seek'],
					'luck': 		d['luck'],
					'luck_max':		d['max_luck']
				},
				'consum': {
					'fuel': 	d['fuel'],
					'ammo': 	d['bullet']
				},
				'remodel': {
					'prev': 		null,
					'prev_lvl': 	null,
					'next': 		d['next'] || null,
					'next_lvl': 	d['nextlv'] || null
				},
				'slot': 	d['carry'],
				'equip': 	d['equip'],
				'rels': {}
			}

			var carry = 0
			for( var i in d['carry'] ){
				carry+= parseInt( d['carry'][i] )
			}

			data.stat.carry = carry
			return data
		}
		function append_tbody_tr(){
			var ship_data = _frame.app_main.page["ships"].section["未入库"]["data"][_index]
			//if( ship_data && ship_data['name'] !== 'なし' && ship_data['id'] < 500 ){
			if( ship_data && ship_data['name'] !== 'なし' ){
				var tr = $('<tr data-shipId="'+ ship_data['id'] +'" data-shipModal="false"/>')
							.on('click', function( e, data_modified ){
								_frame.app_main.page['ships'].show_ship_form(
									$.extend(
										true,
										raw_ship_data_convert(ship_data),
										data_modified || {}
									)
								)
							})
							.appendTo(tbody)
					,max_carry = 0
				for( var i in ship_data['carry'] ){
					max_carry+= ship_data['carry'][i]
				}
				$('<th/>')
					.html(
						'<img src="../pics/ships/'+ship_data['id']+'/0.png"/>'
						+ '<strong>' + ship_data['name'] + '</strong>'
						//+ '<small>' + ship_data['pron'] + '</small>'
					).appendTo(tr)

				//$('<td/>').html(ship_data['id'] + ' / ' + ship_data['no']).appendTo(tr)

				$('<td class="stat-fire"/>').html(ship_data['max_fire']).appendTo(tr)
				$('<td class="stat-torpedo"/>').html(ship_data['max_torpedo']).appendTo(tr)
				$('<td class="stat-aa"/>').html(ship_data['max_aac']).appendTo(tr)
				$('<td class="stat-asw"/>').html(ship_data['max_ass']).appendTo(tr)

				$('<td class="stat-hp"/>').html(ship_data['hp']).appendTo(tr)
				$('<td class="stat-armor"/>').html(ship_data['max_armor']).appendTo(tr)
				$('<td class="stat-evasion"/>').html(ship_data['max_evasion']).appendTo(tr)
				$('<td class="stat-carry"/>').html(max_carry).appendTo(tr)

				$('<td class="stat-speed"/>').html( _g.getStatSpeed( ship_data['speed'] ) ).appendTo(tr)
				$('<td class="stat-range"/>').html( _g.getStatRange( ship_data['range'] ) ).appendTo(tr)
				$('<td class="stat-los"/>').html(ship_data['seek'] + '<sup>' + ship_data['max_seek'] + '</sup>').appendTo(tr)
				$('<td class="stat-luck"/>').html(ship_data['luck'] + '<sup>' + ship_data['max_luck'] + '</sup>').appendTo(tr)
			}
			_index++
			setTimeout(function(){
				append_tbody_tr()
			}, 1)
		}

		append_tbody_tr()

		return table
	},

	'init': function(section){
		// 扫描未入库数据目录，生成表格
		node.fs.readdir(_g.path.fetched.ships, function(err, files){
			for( var i in files ){
				node.fs.readFile(_g.path.fetched.ships + '/' + files[i], 'utf8', function(err, data){
					if(err)
						throw err
					eval('var _data = '+data)
					_frame.app_main.page["ships"].section["未入库"]["data"][_data['id']] = _data
					_frame.app_main.page['ships'].section['未入库']["data_length"]++
					if( _frame.app_main.page['ships'].section['未入库']["data_length"] >= files.length )
						_frame.app_main.page['ships'].section['未入库'].dom.table
							= _frame.app_main.page['ships'].section['未入库'].append_table(section)
				})
			}
			if( err || !files || !files.length ){
				$('<p/>').html('暂无内容...<br />请初始化数据').appendTo(section)
			}
		})
	}
}









_frame.app_main.page['ships'].section['舰种&舰级'] = {
	'dom': {
		'ship_class': 	{}
	},

	'field_input_text': function(name, title, value, suffix){
		var line = $('<p/>')
			,label = $('<label/>').appendTo(line)
		$('<span/>').html(title).appendTo(label)
		$('<input type="text" required name="'+name+'" />').val(value).appendTo(label)
		if( suffix )
			$('<span/>').html(suffix).appendTo(label)
		return line
	},
	'field_actions': function(text, func_delete){
		var line = $('<p class="actions"/>')
		$('<button type="submit"/>').html(text || '提交').appendTo(line)
		if( func_delete ){
			$('<button type="button"/>').html('删除').on('click', function(){
				func_delete()
			}).appendTo(line)
		}
		return line
	},






	// 返回HTML内容
		'content_ship_type': function(d){
			return '<strong>' + d['full_zh'] + '</strong>'
				+ '<small>' + d['full_game'] + '</small>'
				+ '<em>' + d['code'] + '</em>'
		},
		'content_ship_class': function(d){
			return '<strong>' + d['name_zh'] + '级</strong>'
				+ '<small>' + d['name_game'] + '型</small>'
		},







	// 相关表单/按钮
		'titlebtn_ship_type': function( d ){
			var self = _frame.app_main.page['ships'].section['舰种&舰级']
				,btn = $('<button class="ship_type"/>').html(
						self.content_ship_type(d)
					).on('click', function(){
						var _dom = $('<form class="ship_type loading"/>').on('submit',function(e){
								e.preventDefault()
								if( !$(this).hasClass('submitting') && !$(this).hasClass('loading') ){
									$(this).addClass('submitting')
									var newdata = $(this).serializeObject()
									_db.ship_types.update({
										'_id': 	d['_id']
									}, {
										$set: newdata
									}, {}, function (err, numReplaced) {
										btn.html(self.content_ship_type(newdata))
										_frame.modal.hide()
									});
								}
							})
						_db.ship_types.find({
							'_id': 	d['_id']
						}, function(err, docs){
							if( !err ){
								var _data = docs[0]
								var id = self.field_input_text('id', 'ID', _data['id']).appendTo(_dom)
								id.find('input').prop('readonly', true)
								self.field_input_text('code', '舰种简称', _data['code']).appendTo(_dom)
								self.field_input_text('code_game', '舰种简称 (游戏中)', _data['code_game']).appendTo(_dom)
								self.field_input_text('full', '舰种全称', _data['full']).appendTo(_dom)
								self.field_input_text('full_game', '舰种全称 (游戏中)', _data['full_game']).appendTo(_dom)
								self.field_input_text('full_zh', '舰种全称 (中文)', _data['full_zh']).appendTo(_dom)
								var input_id = '_input_g' + _g.inputIndex
								_g.inputIndex++
								$('<input type="checkbox" name="donotcompare" id="'+input_id+'">')
									.prop('checked', _data['donotcompare'])
									.appendTo( _dom )
								$('<label for="'+input_id+'"/>').html('不参与属性表对比').appendTo(_dom)
								self.field_actions('更新', function(){
										// 删除操作
										_db.ship_types.remove({ _id: d['_id'] }, {}, function (err, numRemoved) {
											btn.remove()
											if( self.dom.ship_class[d._id] )
												self.dom.ship_class[d._id].remove()
											_frame.modal.hide()
										});
									}).appendTo(_dom)
								_dom.removeClass('loading')
							}
						})
						_frame.modal.show(_dom, '编辑舰种')
					})
			return btn
		},








	// 新建完毕，添加内容
		'add_ship_type': function( d ){
			var self = _frame.app_main.page['ships'].section['舰种&舰级']

			// 舰种标题，同时也是编辑按钮
				self.titlebtn_ship_type(d).appendTo( self.dom.section )

			// 该舰种舰级DOM
				self.dom.ship_class[d.id] = _p.el.flexgrid.create().addClass('ship_classes').appendTo(self.dom.section)

			// 载入该舰种全部舰级
				_db.ship_classes.find({
					'ship_type_id': 	d['id']
				}, function(err, docs){
					if( !err ){
						for(var i in docs){
							self.add_ship_class(docs[i])
						}
					}
				})
		},

		'add_ship_class': function( d ){
			if( !d )
				return false
			var self = _frame.app_main.page['ships'].section['舰种&舰级']
			self.dom.ship_class[d.ship_type_id].appendDOM(
					$('<button class="unit"/>').html(self.content_ship_class(d))
				)
		},










	'init': function(section){
		var self = _frame.app_main.page['ships'].section['舰种&舰级']

		// 新建按钮
			self.dom.new_container = $('<div class="new_container"/>').appendTo( section )
				self.dom.ship_type_new = $('<button/>').html('新建舰种').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['ships'].gen_form_new_ship_type(
								function(err, newDoc) {
									self.add_ship_type(newDoc)
									_frame.modal.hide()
								}
							), '新建舰种')
					}).appendTo( self.dom.new_container )
				self.dom.ship_class_new = $('<button/>').html('新建舰级').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['ships'].gen_form_new_ship_class(
								function(err, newDoc) {
									self.add_ship_class(newDoc)
									_frame.modal.hide()
								}
							), '新建舰级')
					}).appendTo(self.dom.new_container)

		// 读取舰种表，创建内容
			self.dom.section = $('<div class="main"/>').appendTo(section)
			_db.ship_types.find({}).sort({ 'code': 1, 'full': 1 }).exec(function(err, docs){
				if( !err ){
					for(var i in docs ){
						self.add_ship_type(docs[i])
					}
				}
			})

	}
}









_frame.app_main.page['ships'].section['后缀名'] = {
	'dom': {},
	// 返回HTML内容
		'content_ship_suffix': function(d){
			return '<strong>' + d['zh_cn'] + '</strong>'
				+ '<small>' + d['ja_jp'] + '</small>'
		},







	// 相关表单/按钮
		'titlebtn_ship_suffix': function( d ){
			var self = _frame.app_main.page['ships'].section['后缀名']
				,btn = $('<button class="ship_suffix"/>').html(
						self.content_ship_suffix(d)
					).on('click', function(){
						_frame.modal.show(
							_frame.app_main.page['ships'].gen_form_new_ship_suffix(
								function( newdata ){
									btn.html(self.content_ship_suffix(newdata))
								},
								d,
								function(){
									btn.remove()
								}
							) , '编辑后缀名')
					})
			return btn
		},








	// 新建完毕，添加内容
		'add_ship_suffix': function( d ){
			var self = _frame.app_main.page['ships'].section['后缀名']

			// 舰种标题，同时也是编辑按钮
				self.titlebtn_ship_suffix(d).appendTo( self.dom.section )
		},










	'init': function(section){
		var self = _frame.app_main.page['ships'].section['后缀名']

		// 新建按钮
			self.dom.new_container = $('<div class="new_container"/>').appendTo( section )
				self.dom.btnnew = $('<button/>').html('新建').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['ships'].gen_form_new_ship_suffix(
								function(err, newDoc) {
									self.add_ship_suffix(newDoc)
									_frame.modal.hide()
								}
							), '新建舰名后缀')
					}).appendTo( self.dom.new_container )

		// 读取舰种表，创建内容
			self.dom.section = $('<div class="main"/>').appendTo(section)
			_db.ship_namesuffix.find({}).sort({ 'code': 1, 'full': 1 }).exec(function(err, docs){
				if( !err ){
					for(var i in docs ){
						self.add_ship_suffix(docs[i])
					}
				}
			})

	}
}









_frame.app_main.page['ships'].section['新建'] = {
	'dom': {
	},

	'init': function(section){
		var self = _frame.app_main.page['ships'].section['新建']
		_frame.app_main.page['ships'].section['新建'].dom.section = section

		// 创建form
			self.dom.form = $('<form/>')
								.on('submit', function(e){
									e.preventDefault();
									var formdata = self.dom.form.serializeObject()
										,ship_data = {
											'name': 	{},
											'stat': 	{},
											'consum': 	{},
											'slot': 	[],
											'equip': 	[]
										}
									console.log(formdata)
									if( formdata.remodel_from > -1 ){
										remodel_from = _g.data.ships[formdata.remodel_from]
										ship_data['name'] = remodel_from['name']
										ship_data['type'] = remodel_from['type']
										ship_data['class'] = remodel_from['class']
										ship_data['class_no'] = remodel_from['class_no']
										ship_data['rels'] = remodel_from['rels']
										ship_data['series'] = remodel_from['series']
										ship_data['remodel'] = {
											'prev': 	remodel_from['id']
										}

										delete ship_data['name']['suffix']
									}
									if( formdata['id'] )
										ship_data['id'] = formdata['id']

									if( formdata['no'] )
										ship_data['no'] = formdata['no']

									_frame.app_main.page['ships'].show_ship_form(
										ship_data
									)
								})
								.data({
									'ship_data': {}
								})
								.appendTo( section )

			var id = '_input_g' + _g.inputIndex
			_g.inputIndex++
			$('<p/>')
				.append(
					$('<label for="' +id+ '"/>').html('ID')
				)
				.append(
					$('<input id="' +id+ '" type="number" name="id"/>')
				)
				.appendTo(self.dom.form)
			$('<p/>')
				.append(
					$('<label for="' +id+ '"/>').html('图鉴ID')
				)
				.append(
					$('<input id="' +id+ '" type="number" name="no"/>')
				)
				.appendTo(self.dom.form)

			var id = '_input_g' + _g.inputIndex
			_g.inputIndex++
			var remodelFrom = $('<p/>')
								.append(
									$('<label for="' +id+ '"/>').html('改造自')
								)
								.appendTo(self.dom.form)
			_comp.selector_ship('remodel_from', id).appendTo(remodelFrom)
			/*
			var remodelFromSelect = $('<select name="remodel_from" id="'+id+'"/>')
								.append(
									$('<option value="-1"/>').html('---无---')
								)
								.appendTo(remodelFrom)

			// 载入全部舰娘信息
				_db.ships.find({}).sort({'name.ja_jp':1}).exec(function(err, docs){
					for( var i in docs ){
						self.dom.form.data('ship_data')[docs[i]['id']] = docs[i]
						$('<option value="'+ docs[i]['id'] +'"/>')
							.html(
								(docs[i]['name']['zh_cn'] || docs[i]['name']['ja_jp'])
								+ (docs[i]['name']['suffix']
									? '・' + _g.data.ship_namesuffix[docs[i]['name']['suffix']]['zh_cn']
									: '')
							)
							.appendTo(remodelFromSelect)
					}
				})
				*/

			$('<p class="actions"/>')
								.append(
									$('<button type="submit"/>').html('新建')
								)
								.appendTo(self.dom.form)

	}
}









_frame.app_main.page['ships'].section['舰种集合 (舰娘列表)'] = {
	'dom': {
	},

	// 返回HTML内容
		'content': function(d){
			return '<strong>' + d['name']['zh_cn'] + '</strong>'
		},

	// 相关表单/按钮
		'titlebtn': function( d ){
			var self = _frame.app_main.page['ships'].section['舰种集合 (舰娘列表)']
				,dom = $('<div class="ship_type_collection"/>')
			$('<button class="ship_type_collection"/>').html(
					self.content(d)
				).on('click', function(){
					_frame.modal.show(
						_frame.app_main.page['ships'].gen_form_new_ship_type_order(
							function( newdata ){
								self.titlebtn(newdata)
									.insertAfter(dom)
								dom.remove()
							},
							d,
							function(){
								dom.remove()
							}
						) , '编辑舰种集合')
				}).appendTo(dom)

			var types = $('<div/>').appendTo(dom)
			for( var i in d['types'] ){
				$('<span/>').html(
					_g.data.ship_types[d['types'][i]]['full_zh']
					+ ( parseInt(i) < d['types'].length - 1 ? ', ' : '' )
				).appendTo(types)
			}

			return dom
		},

	// 新建完毕，添加内容
		'add': function( d ){
			var self = _frame.app_main.page['ships'].section['舰种集合 (舰娘列表)']
			/*
				{
					id 			// order
					name
						zh_cn
					types
				}
			*/
			// 舰种标题，同时也是编辑按钮
				self.titlebtn(d).appendTo( self.dom.ship_type_order )
		},

	'init': function(section){
		var self = _frame.app_main.page['ships'].section['舰种集合 (舰娘列表)']
		_frame.app_main.page['ships'].section['舰种集合 (舰娘列表)'].dom.section = section

		var types_collected = []

		// 新建按钮
			self.dom.new_container = $('<div class="new_container"/>').appendTo( section )
				self.dom.btnnew = $('<button/>').html('新建').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['ships'].gen_form_new_ship_type_order(
								function(err, newDoc) {
									self.add(newDoc)
									_frame.modal.hide()
								}
							), '新建舰种集合')
					}).appendTo( self.dom.new_container )

		// 舰种集合列表
			self.dom.ship_type_order = $('<div class="ship_type_collections"/>').appendTo( section )

		// 读取舰种集合db，初始化内容
			_db.ship_type_order.find({}).sort({'id': 1}).exec(function(err, docs){
				if( !err && docs && docs.length ){
					for( var i in docs ){
						self.add(docs[i])
					}
				}
			})
	}
}









_frame.app_main.page['ships'].section['舰种集合 (舰娘选择器)'] = {
	'dom': {
	},

	// 返回HTML内容
		'content': function(d){
			return '<strong>' + d['name']['zh_cn'] + '</strong>'
		},

	// 相关表单/按钮
		'titlebtn': function( d ){
			var self = _frame.app_main.page['ships'].section['舰种集合 (舰娘选择器)']
				,dom = $('<div class="ship_type_collection"/>')
			$('<button class="ship_type_collection"/>').html(
					self.content(d)
				).on('click', function(){
					_frame.modal.show(
						_frame.app_main.page['ships'].gen_form_new_ship_type_collection(
							function( newdata ){
								self.titlebtn(newdata)
									.insertAfter(dom)
								dom.remove()
							},
							d,
							function(){
								dom.remove()
							}
						) , '编辑舰种集合')
				}).appendTo(dom)

			var types = $('<div/>').appendTo(dom)
			for( var i in d['types'] ){
				$('<span/>').html(
					_g.data.ship_types[d['types'][i]]['full_zh']
					+ ( parseInt(i) < d['types'].length - 1 ? ', ' : '' )
				).appendTo(types)
			}

			return dom
		},

	// 新建完毕，添加内容
		'add': function( d ){
			var self = _frame.app_main.page['ships'].section['舰种集合 (舰娘选择器)']
			/*
				{
					id 			// order
					name
						zh_cn
					types
				}
			*/
			// 舰种标题，同时也是编辑按钮
				self.titlebtn(d).appendTo( self.dom.ship_type_collections )
		},

	'init': function(section){
		var self = _frame.app_main.page['ships'].section['舰种集合 (舰娘选择器)']
		_frame.app_main.page['ships'].section['舰种集合 (舰娘选择器)'].dom.section = section

		var types_collected = []

		// 新建按钮
			self.dom.new_container = $('<div class="new_container"/>').appendTo( section )
				self.dom.btnnew = $('<button/>').html('新建').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['ships'].gen_form_new_ship_type_collection(
								function(err, newDoc) {
									self.add(newDoc)
									_frame.modal.hide()
								}
							), '新建舰种集合')
					}).appendTo( self.dom.new_container )

		// 舰种集合列表
			self.dom.ship_type_collections = $('<div class="ship_type_collections"/>').appendTo( section )

		// 读取舰种集合db，初始化内容
			_db.ship_type_collections.find({}).sort({'id': 1}).exec(function(err, docs){
				if( !err && docs && docs.length ){
					for( var i in docs ){
						self.add(docs[i])
					}
				}
			})
	}
}


/*
batch:
	EQUIPMENT.upgrade_from
	arsenal_by_day
*/



_frame.app_main.page['items'] = {}
_frame.app_main.page['items'].section = {}









_frame.app_main.page['items'].show_item_form = function(d){
	console.log(d)
	d['default_equipped_on'] = d['default_equipped_on'] || []

	function _input(name, label, suffix, options){
		return _frame.app_main.page['ships'].gen_form_line(
			'text', name, label, eval( 'd.' + name ) || '', suffix, options
		)
	}
	function _stat(stat, label){
		var line = $('<p/>')
			,id = '_input_g' + _g.inputIndex
		_g.inputIndex++

		switch( stat ){
			case 'dismantle':
				$('<label for="'+id+'"/>').html( '燃料' ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'number',
						'dismantle',
						id,
						d.dismantle[0]
					).appendTo(line)

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<label for="'+id+'"/>').html( '弹药' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'dismantle',
						id,
						d.dismantle[1]
					).appendTo(line)

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<label for="'+id+'"/>').html( '钢材' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'dismantle',
						id,
						d.dismantle[2]
					).appendTo(line)

				id = '_input_g' + _g.inputIndex
				_g.inputIndex++
				$('<label for="'+id+'"/>').html( '铝土' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'dismantle',
						id,
						d.dismantle[3]
					).appendTo(line)
				break;
			case 'range':
				var value = d.stat[stat]

				$('<label for="'+id+'"/>').html( label ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'select',
						'stat.'+stat,
						id,
						[
							{
								'value': 	'1',
								'title': 	'短'
							},
							{
								'value': 	'2',
								'title': 	'中'
							},
							{
								'value': 	'3',
								'title': 	'长'
							},
							{
								'value': 	'4',
								'title': 	'超长'
							}
						],
						{
							'default': 	value
						}
					).appendTo(line)
				$('<label for="'+id+'"/>').html( '当前值: ' + value ).appendTo(line)
				break;
			default:
				var value = d.stat[stat]
				$('<label for="'+id+'"/>').html( label ).appendTo(line)
				var input = _frame.app_main.page['ships'].gen_input(
						'number',
						'stat.'+stat,
						id,
						value
					).appendTo(line)
				break;
		}

		return line
	}
	function _upgrade_to(no, equipment, star){
		var line = $('<p/>')
			,id = '_input_g' + _g.inputIndex
		_g.inputIndex++

		$('<label for="'+id+'"/>').html( '可升级为' ).appendTo(line)
		_comp.selector_equipment('upgrade_to', '', equipment).appendTo(line)
		/*
		_frame.app_main.page['ships'].gen_input(
				'number',
				'upgrade_to',
				id,
				equipment
			).appendTo(line)*/

		id = '_input_g' + _g.inputIndex
		_g.inputIndex++
		$('<label for="'+id+'"/>').html( '初始星级' ).appendTo(line)
		_frame.app_main.page['ships'].gen_input(
				'number',
				'upgrade_to_star',
				id,
				star
			).appendTo(line)

		// 删除本行信息
		$('<button type="button" class="delete"/>').html('&times;').on('click', function(){
			line.remove()
		}).appendTo(line)

		return line
	}
	function _improvement( improvement ){
		improvement = improvement || {
				// 可升级为
				// 不可升级为 false
				// 可升级为 [NUMBER euipment_id, NUMBER base_star]
					upgrade: false,
				// 资源消费
					resource: [
						// 必要资源		油/弹/钢/铝
							[0, 0, 0, 0],
						// +0 ~ +5		开发资材 / 开发资材（确保） / 改修资财 / 改修资财（确保） / 需要装备 / 需要装备数量
							[0, 0, 0, 0, null, 0],
						// +6 ~ MAX		开发资材 / 开发资材（确保） / 改修资财 / 改修资财（确保） / 需要装备 / 需要装备数量
							[0, 0, 0, 0, null, 0],
						// 升级			开发资材 / 开发资材（确保） / 改修资财 / 改修资财（确保） / 需要装备 / 需要装备数量
							[0, 0, 0, 0, null, 0]
					],
				// 星期 & 秘书舰
					req: [
						[
							// 星期，0为周日，1为周一
							[false, false, false, false, false, false, false],
							// 秘书舰，ARRAY，舰娘ID，没有则为false
							false
						]
					]
			}

		var block = $('<div class="improvement"/>')
			,id
			,line

		// 可升级至
			line = $('<p class="upgrade"/>').appendTo(block)

			$('<label/>').html( '可升级为' ).appendTo(line)
			_comp.selector_equipment(
				'',
				'',
				improvement.upgrade ? improvement.upgrade[0] : null
			).appendTo(line)

			id = _g.newInputIndex()
			$('<label for="'+id+'"/>').html( '初始星级' ).appendTo(line)
			_frame.app_main.page['ships'].gen_input(
					'number',
					'',
					id,
					improvement.upgrade ? improvement.upgrade[1] : 0
				).appendTo(line)

		// 星期 & 秘书舰
			var subblock = $('<div class="require"/>').html('<h5>星期 & 秘书舰</h5>').appendTo(block)
			function _reqs(req){
				var reqblock = $('<div/>').appendTo(block)

				$('<h6/>').html('星期').appendTo(reqblock)
				for(var j=0; j<7; j++){
					var text
					switch(j){
						case 0: text='日'; break;
						case 1: text='一'; break;
						case 2: text='二'; break;
						case 3: text='三'; break;
						case 4: text='四'; break;
						case 5: text='五'; break;
						case 6: text='六'; break;
					}
					id = _g.newInputIndex()
					$('<input type="checkbox" id="'+id+'"/>').prop('checked', req[0][j]).appendTo(reqblock)
					$('<label for="'+id+'"/>').html(text).appendTo(reqblock)
				}

				$('<h6/>').html('秘书舰').appendTo(reqblock)
				function _reqship(reqship){
					var reqshipline = $('<p/>').appendTo(reqblock)
					_comp.selector_ship(null, null, reqship).appendTo(reqshipline)
					// 删除本条信息
						$('<button type="button" class="delete"/>').html('&times;').on('click', function(){
							reqshipline.remove()
						}).appendTo(reqshipline)
					return reqshipline
				}
				for(var ii=0; ii<(req[1] ? req[1].length : 0); ii++ ){
					_reqship(req[1] ? req[1][ii] : false).appendTo(reqblock)
				}
				var btn_add_reqship = $('<button class="add" type="button"/>').on('click', function(){
					_reqship().insertBefore(btn_add_reqship)
				}).html('+ 秘书舰').appendTo(reqblock)

				// 删除本条信息
					$('<button type="button" class="delete"/>').html('&times;').on('click', function(){
						reqblock.remove()
					}).appendTo(reqblock)

				return reqblock
			}
			for(var i=0; i<improvement.req.length; i++ ){
				_reqs(improvement.req[i]).appendTo(subblock)
			}
			var btn_add_reqs = $('<button class="add" type="button"/>').on('click', function(){
				_reqs([
					// 星期，0为周日，1为周一
					[false, false, false, false, false, false, false],
					// 秘书舰，ARRAY，舰娘ID
					false
				]).insertBefore(btn_add_reqs)
			}).html('+ 要求').appendTo(subblock)

		// 资源消费
			// 固定资源
				line = $('<p class="resource resource-all"/>')
					.append(
						$('<h5/>').html('资源消费')
					).appendTo(block)

				id = _g.newInputIndex()
				$('<label for="'+id+'"/>').html( '燃料' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'',
						id,
						improvement.resource[0][0]
					).appendTo(line)

				id = _g.newInputIndex()
				$('<label for="'+id+'"/>').html( '弹药' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'',
						id,
						improvement.resource[0][1]
					).appendTo(line)

				id = _g.newInputIndex()
				$('<label for="'+id+'"/>').html( '钢材' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'',
						id,
						improvement.resource[0][2]
					).appendTo(line)

				id = _g.newInputIndex()
				$('<label for="'+id+'"/>').html( '铝土' ).appendTo(line)
				_frame.app_main.page['ships'].gen_input(
						'number',
						'',
						id,
						improvement.resource[0][3]
					).appendTo(line)
			// 其他资源
				for(var i=1; i<4; i++){
					var title
					switch(i){
						case 1:	title = '+0 ~ +5'; break;
						case 2:	title = '+6 ~ MAX'; break;
						case 3:	title = '升级'; break;
					}
					line = $('<p class="resource resource-mat"/>')
						.append(
							$('<h5/>').html(title)
						).appendTo(block)

					id = _g.newInputIndex()
					$('<label for="'+id+'"/>').html( '开发' ).appendTo(line)
					_frame.app_main.page['ships'].gen_input(
							'number',
							'',
							id,
							improvement.resource[i][0]
						).appendTo(line)

					id = _g.newInputIndex()
					$('<label for="'+id+'"/>').html( '确' ).appendTo(line)
					_frame.app_main.page['ships'].gen_input(
							'number',
							'',
							id,
							improvement.resource[i][1]
						).appendTo(line)

					id = _g.newInputIndex()
					$('<label for="'+id+'"/>').html( '改修' ).appendTo(line)
					_frame.app_main.page['ships'].gen_input(
							'number',
							'',
							id,
							improvement.resource[i][2]
						).appendTo(line)

					id = _g.newInputIndex()
					$('<label for="'+id+'"/>').html( '确' ).appendTo(line)
					_frame.app_main.page['ships'].gen_input(
							'number',
							'',
							id,
							improvement.resource[i][3]
						).appendTo(line)

					$('<label/>').html( '装备' ).appendTo(line)
					_comp.selector_equipment(
						'',
						'',
						improvement.resource[i][4]
					).appendTo(line)

					id = _g.newInputIndex()
					$('<label for="'+id+'"/>').html( '量' ).appendTo(line)
					_frame.app_main.page['ships'].gen_input(
							'number',
							'',
							id,
							improvement.resource[i][5]
						).appendTo(line)
				}

		// 删除本条信息
			$('<button type="button" class="delete"/>').html('&times;').on('click', function(){
				block.remove()
			}).appendTo(block)

		return block
	}

	var form = $('<form class="iteminfo new"/>')

		,base = $('<div class="base"/>').appendTo(form)
		,details = $('<div class="tabview"/>').appendTo(form)

		// 如果有 _id 则表明已存在数据，当前为编辑操作，否则为新建操作
		,_id = d._id ? $('<input type="hidden"/>').val( d._id ) : null

		,details_stat = $('<section data-tabname="属性"/>').appendTo(details)
		,details_craft = $('<section data-tabname="开发&改修"/>').appendTo(details)
		,details_equipped = $('<section data-tabname="初装舰娘"/>').appendTo(details)

	// 标准图鉴
		,base_image = $('<div class="image"/>').css('background-image', 'url(../pics/items/'+d['id']+'/card.png)').appendTo(base)

	// 基础信息
		_input('id', 'ID', null, {'required': true}).appendTo(base)
		_input('rarity', '稀有度', null, {'required': true}).appendTo(base)
		// 类型
			var base_type = _frame.app_main.page['ships'].gen_form_line(
					'select',
					'type',
					'类型',
					[]
				).appendTo(base)
			_db.item_types.find({}).sort({ 'id': 1 }).exec(function(err, docs){
				if( !err ){
					var types = []
						,sel = base_type.find('select')
					for(var i in docs ){
						types.push({
							//'value': 	docs[i]['_id'],
							'value': 	docs[i]['id'],
							'title': 	docs[i]['name']['zh_cn']
						})
					}
					// 实时载入类型数据
					_frame.app_main.page['ships'].gen_input(
						'select',
						sel.attr('name'),
						sel.attr('id'),
						types,
						{
							'default': d['type'],
							'new': function( select ){
								console.log( 'NEW SHIP TYPE', select )
							}
						}).insertBefore(sel)
					sel.remove()
				}
			})
		var h4 = $('<h4/>').html('装备名').appendTo(base)
		var checkbox_id = '_input_g' + _g.inputIndex
		_g.inputIndex++
		_input('name.ja_jp', '<small>日</small>').appendTo(base)
		_input('name.ja_kana', '<small>日假名</small>').appendTo(base)
		_input('name.ja_romaji', '<small>罗马音</small>').appendTo(base)
		_input('name.zh_cn', '<small>简中</small>').appendTo(base)


	// 属性
		_stat('fire', '火力').appendTo(details_stat)
		_stat('torpedo', '雷装').appendTo(details_stat)
		_stat('bomb', '爆装').appendTo(details_stat)
		_stat('asw', '对潜').appendTo(details_stat)
		_stat('aa', '对空').appendTo(details_stat)
		_stat('armor', '装甲').appendTo(details_stat)
		_stat('evasion', '回避').appendTo(details_stat)
		_stat('hit', '命中').appendTo(details_stat)
		_stat('los', '索敌').appendTo(details_stat)
		_stat('range', '射程').appendTo(details_stat)

		$('<h4/>').html('废弃资源').appendTo(details_stat)
		_stat('dismantle').appendTo(details_stat)


	// 开发&改修
		var line = $('<p/>').appendTo( details_craft )
			,id = '_input_g' + _g.inputIndex
		_g.inputIndex++
		_frame.app_main.page['ships'].gen_input(
				'checkbox',
				'craftable',
				id,
				d.craftable || false
			).appendTo(line)
		$('<label for="'+id+'"/>').html( '可开发' ).appendTo(line)

		// 改修
			$('<h4/>').html('改修').appendTo(details_craft)
			for(var i=0; i<(d['improvement'] ? d['improvement'].length : 0); i++ ){
				_improvement(d['improvement'] ? d['improvement'][i] : null).appendTo(details_craft)
			}
			var btn_add_improvement = $('<button class="add" type="button"/>').on('click', function(){
				_improvement().insertBefore(btn_add_improvement)
			}).html('+ 改修项目').appendTo(details_craft)
		/*
		var line = $('<p/>').appendTo( details_craft )
			,id = '_input_g' + _g.inputIndex
		_g.inputIndex++
		_frame.app_main.page['ships'].gen_input(
				'checkbox',
				'improvable',
				id,
				d.improvable || false
			).appendTo(line)
		$('<label for="'+id+'"/>').html( '可改修' ).appendTo(line)
		for(var i=0; i<(d['upgrade_to'] ? d['upgrade_to'].length : 0); i++ ){
			_upgrade_to(
				(i+1),
				d['upgrade_to'][i][0] || null,
				d['upgrade_to'][i][1] || '0'
			).appendTo(details_craft)
		}
		var btn_add_upgrade_to = $('<button class="add" type="button"/>').on('click', function(){
			details_craft.find('input[name="improvable"]').prop('checked', true)
			_upgrade_to(
				details_craft.find('input[name="upgrade_to"]').length + 1,
				null,
				'0'
			).insertBefore(btn_add_upgrade_to)
		}).html('+ 可升级为...').appendTo(details_craft)
		*/


	// 初装舰娘
		var ships_equipped = {}
		_db.ships.find({"equip": d['id']}, function(err,docs){
			for(var i in docs){
				if( typeof ships_equipped[docs[i]['series']] == 'undefined' )
					ships_equipped[docs[i]['series']] = []
				ships_equipped[docs[i]['series']].push( docs[i] )
			}
			for(var i in ships_equipped){
				ships_equipped[i].sort(function(a,b){
					return a['name']['suffix'] - b['name']['suffix']
				})
				for( var j in ships_equipped[i] ){
					d['default_equipped_on'].push( ships_equipped[i][j]['id'] )
					$('<div/>')
						.html(
							'<img src="../pics/ships/'+ships_equipped[i][j]['id']+'/0.png"/>'
							+ '[' + ships_equipped[i][j]['id'] + '] '
							+ (ships_equipped[i][j]['name']['zh_cn'] || ships_equipped[i][j]['name']['ja_jp'])
							+ (ships_equipped[i][j]['name']['suffix']
								? '・' + _g.data.ship_namesuffix[ships_equipped[i][j]['name']['suffix']]['zh_cn']
								: '')
						)
						.appendTo(details_equipped)
				}
			}
		})


	// 提交等按钮
		var line = $('<p class="actions"/>').appendTo( form )
		$('<button type="submit"/>').html( d._id ? '编辑' : '入库').appendTo(line)


	// 提交函数
		form.on('submit', function(e){
			e.preventDefault()
			var data = {}
				,$form = $(this)
			function start_db_operate(){
				if( _id ){
					// 存在 _id，当前为更新操作
					data.time_modified = _g.timeNow()
					console.log( 'EDIT', data )
					_db.items.update({
						'_id': 		d._id
					},{
						$set: data
					},{}, function(err, numReplaced){
						console.log('UPDATE COMPLETE', numReplaced, data)
						data._id = d._id
						// 在已入库表格中更改原有数据行
							var oldTr = _frame.app_main.page['items'].section['已入库'].dom.section
											.find('[data-itemid="'+data['id']+'"]')
							_frame.app_main.page['items'].section['已入库'].dom.section.data('itemlist').append_item( data )
								.insertBefore( oldTr )
							oldTr.remove()
							_frame.modal.hide()
					})
				}else{
					// 不存在 _id，当前为新建操作
					data.time_created = _g.timeNow()
					// 删除JSON数据
						node.fs.unlink(_g.path.fetched.items + '/' + data['id'] + '.json', function(err){
							_db.items.insert(data, function(err, newDoc){
								console.log('INSERT COMPLETE', newDoc)
								// 删除“未入库”表格中对应的行
									try{
										_frame.app_main.page['items'].section['未入库'].dom.main
											.find('[data-itemid="'+data['id']+'"]').remove()
									}catch(e){}
								// 在“已入库”表格开头加入行
									_frame.app_main.page['items'].section['已入库'].dom.section.data('itemlist').append_item( newDoc )
								_frame.modal.hide()
							})
						})
				}
			}

			// 处理所有数据
				data = $form.serializeObject()
				//data['default_equipped_on'] = d['default_equipped_on']
				delete( data['default_equipped_on'] )
				data['craftable'] = data['craftable'] ? true : false

				// 改修数据
					data.improvable = false
					data.upgrade_to = null
					data['improvement'] = false
					$form.find('.improvement').each(function(index){
						data.improvable = true
						if( !data['improvement'] )
							data['improvement'] = []
						var data_improvement = {
								'upgrade': 	false,
								'req':		[],
								'resource':	[[],[],[],[]]
							}
							,$this = $(this)
						// upgrade
							var upgrade = $this.find('.upgrade')
								,upgrade_to = parseInt(upgrade.find('select').val())
							if( !isNaN(upgrade_to) ){
								if( !data.upgrade_to )
									data.upgrade_to = []
								var base_star = parseInt($this.find('input[type="number"]').val()) || 0
								data_improvement.upgrade = [
									upgrade_to,
									base_star
								]
								data.upgrade_to.push([upgrade_to, base_star])
							}
						// req
							$this.find('.require>div').each(function(i){
								var data_req = [[], false]
								$(this).find('input[type="checkbox"]').each(function(weekday){
									data_req[0][weekday] = $(this).prop('checked')
								})
								$(this).find('select').each(function(shipindex){
									if( !data_req[1] )
										data_req[1] = []
									var val = $(this).val()
									if( val )
										data_req[1].push( parseInt(val) )
								})
								data_improvement.req.push(data_req)
							})
						// resource
							$this.find('.resource').each(function(i){
								$(this).find('input, select').each(function(inputindex){
									data_improvement.resource[i].push( parseInt($(this).val()) || 0 )
								})
							})
						data['improvement'].push(data_improvement)
					})
				// 改修升级数据
				/*
					data['improvable'] = data['improvable'] ? true : false
					if( data['upgrade_to'] ){
						var _d_upgrade_to = []
						if( !data['upgrade_to'].push )
							data['upgrade_to'] = [ data['upgrade_to'] ]
						if( !data['upgrade_to_star'].push )
							data['upgrade_to_star'] = [ data['upgrade_to_star'] ]
						for( var i in data['upgrade_to'] ){
							_d_upgrade_to[i] = [
								data['upgrade_to'][i],
								data['upgrade_to_star'][i] || 0
							]
						}
						data['upgrade_to'] = _d_upgrade_to
						delete( data['upgrade_to_star'] )
					}else{
						data['upgrade_to'] = null
					}
				*/
				console.log(data)
				//return data

			// 写入数据库
				start_db_operate()
		})


	_frame.modal.show(
		form,
		d.name.ja_jp || '未入库装备',
		{
			'classname': 	'infos_form'
		}
	)
}








_frame.app_main.page['items'].field_input_text = function(name, title, value, suffix){
	var line = $('<p/>')
		,label = $('<label/>').appendTo(line)
	$('<span/>').html(title).appendTo(label)
	$('<input type="text" required name="'+name+'" />').val(value).appendTo(label)
	if( suffix )
		$('<span/>').html(suffix).appendTo(label)
	return line
}
_frame.app_main.page['items'].field_select_items = _comp.selector_equipment
/*
_frame.app_main.page['items'].field_select_items = function( name, label, default_item ){
	var dom = _frame.app_main.page['ships'].gen_input(
			'select',
			name,
			label,
			[]
		)
		,equipments = []
		,options = []

	_db.item_types.find({}).sort({'id': 1}).exec(function(err, docs){
		if( !err && docs && docs.length ){
			for( var i in docs ){
				equipments[docs[i]['id']] = [
					docs[i]['name']['zh_cn'],
					[]
				]
			}
			_db.items.find({}).sort({ 'type': 1, 'rarity': 1, 'id': 1 }).exec(function(err, docs){
				for(var i in docs ){
					//equipments[docs[i]['type']][1].push(docs[i])
					equipments[docs[i]['type']][1].push({
							'name': 	docs[i]['name']['zh_cn'],
							'value': 	docs[i]['id']
						})
				}

				for( var i in equipments ){
					options.push({
						'name': 	'=====' + equipments[i][0] +  '=====',
						'value': 	''
					})
					for( var j in equipments[i][1] ){
						options.push({
							'name': 	equipments[i][1][j]['name']['zh_cn'],
							'value': 	equipments[i][1][j]['id']
						})
					}
				}
				//console.log( equipments )
				//console.log( options )

				_frame.app_main.page['ships'].gen_input(
					'select_group',
					dom.attr('name'),
					dom.attr('id'),
					equipments,
					{
						'default': default_item
					}).insertBefore(dom)
				dom.remove()
			})
		}
	})
	return dom
}*/
_frame.app_main.page['items'].field_actions = function(text, func_delete){
	var line = $('<p class="actions"/>')
	$('<button type="submit"/>').html(text || '提交').appendTo(line)
	if( func_delete ){
		$('<button type="button"/>').html('删除').on('click', function(){
			func_delete()
		}).appendTo(line)
	}
	return line
}










_frame.app_main.page['items'].gen_form_new_item_type = function( callback, data_edit, callback_remove ){
	callback = callback || function(){}
	let is_edit = (data_edit)
	var self = _frame.app_main.page['items']
		,form = $('<form class="itemform item_type"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()

					if( typeof data['equipable_on_type'] != 'object' && typeof data['equipable_on_type'] != 'undefined' )
						data['equipable_on_type'] = [data['equipable_on_type']]
					data['equipable_on_type'] = data['equipable_on_type'] || []

					/* scrapped 2015/05/26
					if( typeof data['equipable_on_stat'] != 'object' && typeof data['equipable_on_stat'] != 'undefined' )
						data['equipable_on_stat'] = [data['equipable_on_stat']]
					data['equipable_on_stat'] = data['equipable_on_stat'] || []
					*/

					if( is_edit ){
						// 编辑操作
						_db.item_types.update({
							'_id': 	data_edit['_id']
						}, {
							$set: data
						}, {}, function (err, numReplaced) {
							callback( data )
							_frame.modal.hide()
						});
					}else{
						// 新建操作
						// 获取当前总数，确定数字ID
						// 之后插入数据
							_db.item_types.count({}, function(err, count){
								data['id'] = parseInt(count) + 1
								_db.item_types.insert(
									data,
									callback
								);
							})
					}
				})
		,input_container = $('<div/>').appendTo(form)

	self.field_input_text('name.ja_jp', '日', is_edit ? data_edit['name']['ja_jp'] : null).appendTo(input_container)
	self.field_input_text('name.zh_cn', '简中', is_edit ? data_edit['name']['zh_cn'] : null).appendTo(input_container)

	$('<h4/>').html('图标').appendTo(input_container)
	// icon
		// 扫描图标目录，生成选择项
		//var path_icons = process.cwd() + '/app/assets/images/itemicon/transparent'
		var path_icons = './app/assets/images/itemicon/transparent'
			,icon_radios = $('<div class="icons"/>').appendTo(input_container)
			,icons = []
		node.fs.readdir(path_icons, function(err, files){
			for( var i in files ){
				icons.push(files[i])
			}
			icons.sort(function(a, b){
				return parseInt(a.split('.')[0]) - parseInt(b.split('.')[0])
			});
			for( var i in icons ){
				var id = '_input_g' + _g.inputIndex
					,filename = icons[i].split('.')[0]
					,unitDOM = $('<span class="unit"/>').appendTo(icon_radios)
				_g.inputIndex++
				$('<input type="radio" name="icon" value="'+filename+'" id="'+id+'"/>')
					.prop('checked', (data_edit && data_edit.icon == filename) )
					.appendTo(unitDOM)
				$('<label for="'+id+'"/>')
					.css('background-image','url(../'+ path_icons + '/' + icons[i] +')')
					.appendTo(unitDOM)
			}
		})

	$('<h4/>').html('可装备舰种').appendTo(input_container)
	// equipable_on_type
		// 读取舰种DB，生成选择项
		var shiptype_checkboxes = _p.el.flexgrid.create().addClass('ship_types').appendTo( input_container )
			,equipable_on_type = is_edit ? data_edit['equipable_on_type'] : []
		_db.ship_types.find({}).sort({'id': 1}).exec(function(err, docs){
			for(var i in docs ){
				var type_id = parseInt(docs[i]['id'])
					,input_id = '_input_g' + _g.inputIndex
					,unitDOM = $('<div class="unit"/>')
				shiptype_checkboxes.appendDOM(unitDOM)
				_g.inputIndex++
				$('<input type="checkbox" name="equipable_on_type" value="'+type_id+'" id="'+input_id+'">')
					.prop('checked', ($.inArray(type_id, equipable_on_type) > -1) )
					.appendTo( unitDOM )
				$('<label for="'+input_id+'"/>').html(docs[i]['full_zh']).appendTo(unitDOM)
			}
		})

	$('<h4/>').html('主属性').appendTo(input_container)
		var stats_radios = _p.el.flexgrid.create().addClass('stats').appendTo( input_container )
			,main_attribute = is_edit ? (data_edit['main_attribute'] || null) : null
			,stats = [
				['火力',	'fire'],
				['雷装',	'torpedo'],
				['对空',	'aa'],
				['对潜',	'asw'],
				['爆装',	'bomb'],
				['命中',	'hit'],
				['装甲',	'armor'],
				['回避',	'evasion'],
				['索敌',	'los'],
				['运',		'luck']
			]
		for(var i in stats ){
			var input_id = '_input_g' + _g.inputIndex
				,unitDOM = $('<div class="unit"/>')
			stats_radios.appendDOM(unitDOM)
			_g.inputIndex++
			$('<input type="radio" name="main_attribute" value="'+stats[i][1]+'" id="'+input_id+'">')
				.prop('checked', (stats[i][1] == main_attribute) )
				.appendTo( unitDOM )
			$('<label for="'+input_id+'"/>').html(stats[i][0]).appendTo(unitDOM)
		}

	/* scrapped 2015/05/26
	$('<h4/>').html('当存在以下属性时可装备').appendTo(input_container)
	// equipable_on_stat
		var stats_checkboxes = _p.el.flexgrid.create().addClass('stats').appendTo( input_container )
			,equipable_on_stat = is_edit ? (data_edit['equipable_on_stat'] || []) : []
			,stats = [
				['火力',	'fire'],
				['雷装',	'torpedo'],
				['对空',	'aa'],
				['对潜',	'asw'],
				['耐久',	'hp'],
				['装甲',	'armor'],
				['回避',	'evasion'],
				['搭载',	'carry'],
				['航速',	'speed'],
				['射程',	'range'],
				['索敌',	'los'],
				['运',		'luck']
			]
		for(var i in stats ){
			var input_id = '_input_g' + _g.inputIndex
				,unitDOM = $('<div class="unit"/>')
			stats_checkboxes.appendDOM(unitDOM)
			_g.inputIndex++
			$('<input type="checkbox" name="equipable_on_stat" value="'+stats[i][1]+'" id="'+input_id+'">')
				.prop('checked', ($.inArray(stats[i][1], equipable_on_stat) > -1) )
				.appendTo( unitDOM )
			$('<label for="'+input_id+'"/>').html(stats[i][0]).appendTo(unitDOM)
		}
	*/

	self.field_actions(
		is_edit ? '更新' : null,
		callback_remove ? function(){
				_db.item_types.remove({ _id: data_edit['_id'] }, {}, function (err, numRemoved) {
					callback_remove()
					_frame.modal.hide()
				});
			} : null
	).appendTo(form)
	return form
}

_frame.app_main.page['items'].gen_form_new_item_type_collection = function( callback, data_edit, callback_remove ){
	callback = callback || function(){}
	let is_edit = (data_edit)
	var self = _frame.app_main.page['items']
		,form = $('<form class="itemform item_type_collection"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()

					if( typeof data['types'] != 'object' && typeof data['types'] != 'undefined' )
						data['types'] = [data['types']]
					data['types'] = data['types'] || []

					if( is_edit ){
						// 编辑操作
						_db.item_type_collections.update({
							'_id': 	data_edit['_id']
						}, {
							$set: data
						}, {}, function (err, numReplaced) {
							callback( data )
							_frame.modal.hide()
						});
					}else{
						// 新建操作
						// 获取当前总数，确定数字ID
						// 之后插入数据
							_db.item_type_collections.count({}, function(err, count){
								data['id'] = parseInt(count) + 1
								_db.item_type_collections.insert(
									data,
									callback
								);
							})
					}
				})
		,input_container = $('<div/>').appendTo(form)

	self.field_input_text('name.zh_cn', '简中', is_edit ? data_edit['name']['zh_cn'] : null).appendTo(input_container)

	$('<h4/>').html('图标').appendTo(input_container)
	// icon
		// 扫描图标目录，生成选择项
		var path_icons = './app/assets/images/itemcollection'
			,icon_radios = $('<div class="icons"/>').appendTo(input_container)
			,icons = []
		node.fs.readdir(path_icons, function(err, files){
			for( var i in files ){
				icons.push(files[i])
			}
			icons.sort(function(a, b){
				return parseInt(a.split('.')[0]) - parseInt(b.split('.')[0])
			});
			for( var i in icons ){
				var id = '_input_g' + _g.inputIndex
					,filename = icons[i].split('.')[0]
					,unitDOM = $('<span class="unit"/>').appendTo(icon_radios)
				_g.inputIndex++
				$('<input type="radio" name="icon" value="'+filename+'" id="'+id+'"/>')
					.prop('checked', (data_edit && data_edit.icon == filename) )
					.appendTo(unitDOM)
				$('<label for="'+id+'"/>')
					.css('background-image','url(../'+ path_icons + '/' + icons[i] +')')
					.appendTo(unitDOM)
			}
		})

	$('<h4/>').html('装备类型').appendTo(input_container)
	_form.create_item_types('types', is_edit ? data_edit['types'] : []).appendTo( input_container )

	self.field_actions(
		is_edit ? '更新' : null,
		callback_remove ? function(){
				_db.item_type_collections.remove({ _id: data_edit['_id'] }, {}, function (err, numRemoved) {
					callback_remove()
					_frame.modal.hide()
				});
			} : null
	).appendTo(form)
	return form
}

















_frame.app_main.page['items'].init = function(page){
	page.find('section').on({
		'tabview-show': function(){
			var section = $(this)
				,name = section.data('tabname')

			if( !_frame.app_main.page['items'].section[name] )
				_frame.app_main.page['items'].section[name] = {}

			var _o = _frame.app_main.page['items'].section[name]

			if( !_o.is_init && _o.init ){
				_o.init(section)
				_o.is_init = true
			}
			switch( name ){
				case '未入库':
					break;
			}
		}
	})
}









_frame.app_main.page['items'].section['已入库'] = {
	'dom': {
	},

	'init': function(section){
		_frame.app_main.page['items'].section['已入库'].dom.section = section
	}
}









_frame.app_main.page['items'].section['未入库'] = {
	'dom': {},
	'data': {},
	'data_id': [],

	'init_list': function(index){
		var self = _frame.app_main.page['items'].section['未入库']
			,id = _frame.app_main.page['items'].section['未入库']['data_id'][index]
			,data = _frame.app_main.page['items'].section['未入库']['data'][id]

		function raw_ship_data_convert(d){
			var data_converted = {
				'id': 	d['id'],
				'name': {
					'ja_jp': 	d['name']
				},
				'type': 	null,
				'rarity': 	d['rarity'] == 0 || d['rarity'] == 1 ? parseInt(d['rarity']) + 1 : parseInt(d['rarity']),
				'stat': {
					'fire': 		d['fire'],
					'torpedo': 		d['torpedo'],
					'bomb': 		d['bomb'],
					'asw': 			d['ass'],
					'aa': 			d['aac'],
					'armor': 		d['armor'],
					'evasion': 		d['evasion'],
					'hit': 			d['hit'],
					'los': 			d['seek'],
					'range':		d['range'],
				},
				'dismantle': 	JSON.parse(d['dismantle']),
				'default_equipped_on': 	[]
			}

			return data_converted
		}

		self.dom.list.appendDOM(
			$('<button class="unit newitem" data-itemid="'+ id +'" data-itemmodal="false"/>')
				.append(
					$('<span><img src="../pics/items/'+id+'/card.png" alt="'+data['name']+'"/></span>')
				)
				.on('click', function( e, data_modified ){
					//console.log( data )
					_frame.app_main.page['items'].show_item_form(
						$.extend(
							true,
							raw_ship_data_convert(data),
							data_modified || {}
						)
					)
				})
		)

		if( index >= _frame.app_main.page['items'].section['未入库']['data_id'].length - 1 ){
			self.dom.new_container.html( 'All ' + _frame.app_main.page['items'].section['未入库']['data_id'].length + ' items loaded.')
		}else{
			index++
			self.dom.new_container.html( index + ' / ' + _frame.app_main.page['items'].section['未入库']['data_id'].length + ' items loaded.')
			setTimeout(function(){
				_frame.app_main.page['items'].section['未入库'].init_list(index)
			}, 10)
		}
	},

	'init': function(section){
		var self = _frame.app_main.page['items'].section['未入库']

		// 载入中信息
			self.dom.new_container = $('<div class="new_container"/>').html('Loading...').appendTo( section )

		// 列表container
			self.dom.main = $('<div class="main"/>').appendTo( section )
			self.dom.list = _p.el.flexgrid.create().addClass('newitems').appendTo( self.dom.main )

		// 扫描目标文件夹，初始化内容
			_db.items.find({}).sort({'id': 1}).exec(function(err, docs){
				if( !err && docs && docs.length ){
					for( var i in docs ){
						self.add(docs[i])
					}
				}
			})
			node.fs.readdir(_g.path.fetched.items, function(err, files){
				for( var i in files ){
					node.fs.readFile(_g.path.fetched.items + '/' + files[i], 'utf8', function(err, data){
						if(err)
							throw err
						eval('var _data = '+data)
						_frame.app_main.page["items"].section["未入库"]["data"][_data['id']] = _data
						_frame.app_main.page["items"].section["未入库"]["data_id"].push( _data['id'] )
						if( _frame.app_main.page['items'].section['未入库']["data_id"].length >= files.length ){
							_frame.app_main.page['items'].section['未入库']['data_id'].sort(function(a,b){return a-b})
							_frame.app_main.page['items'].section['未入库'].init_list(0)
						}
					})
				}
				if( err || !files || !files.length ){
					$('<p/>').html('暂无内容...<br />请初始化数据').appendTo(self.dom.list)
				}
			})
	}
}









_frame.app_main.page['items'].section['类型'] = {
	'dom': {
	},

	// 相关表单/按钮
		'titlebtn': function( d ){
			var self = _frame.app_main.page['items'].section['类型']
				,btn = $('<button class="unit item_type"/>').html(
							'<span style="background-image: url(../app/assets/images/itemicon/transparent/'+d['icon']+'.png)"></span>'
							+ d['name']['zh_cn']
						)
						.on('click', function(){
							_frame.modal.show(
								_frame.app_main.page['items'].gen_form_new_item_type(
									function( newdata ){
										self.titlebtn( newdata )
											.insertAfter( btn )
										btn.remove()
									},
									d,
									function(){
										btn.remove()
									}
								) , '编辑类型')
						})
			return btn
		},

	// 新建完毕，添加内容
		'add': function( d ){
			var self = _frame.app_main.page['items'].section['类型']
			// 标题，同时也是编辑按钮
				self.dom.list.appendDOM( self.titlebtn(d) )
		},

	'init': function(section){
		var self = _frame.app_main.page['items'].section['类型']

		// 新建按钮
			self.dom.new_container = $('<div class="new_container"/>').appendTo( section )
				self.dom.btnnew = $('<button/>').html('新建').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['items'].gen_form_new_item_type(
								function(err, newDoc) {
									self.add(newDoc)
									_frame.modal.hide()
								}
							), '新建类型')
					}).appendTo( self.dom.new_container )

		// 列表container
			self.dom.main = $('<div class="main"/>').appendTo( section )
			self.dom.list = _p.el.flexgrid.create().addClass('item_types').appendTo( self.dom.main )

		// 读取db，初始化内容
			_db.item_types.find({}).sort({'id': 1}).exec(function(err, docs){
				if( !err && docs && docs.length ){
					for( var i in docs ){
						self.add(docs[i])
					}
				}
			})
	}
}









_frame.app_main.page['items'].section['类型集合'] = {
	'dom': {
	},

	// 相关表单/按钮
		'titlebtn': function( d ){
			var self = _frame.app_main.page['items'].section['类型集合']
				,btn = $('<button class="item_type_collection"/>').html(
							d['name']['zh_cn']
						)
						.on('click', function(){
							_frame.modal.show(
								_frame.app_main.page['items'].gen_form_new_item_type_collection(
									function( newdata ){
										self.titlebtn( newdata )
											.insertAfter( btn )
										btn.remove()
									},
									d,
									function(){
										btn.remove()
									}
								) , '编辑类型集合')
						})
			return btn
		},

	// 新建完毕，添加内容
		'add': function( d ){
			var self = _frame.app_main.page['items'].section['类型集合']
			// 标题，同时也是编辑按钮
				self.titlebtn(d).appendTo( self.dom.main )
		},

	'init': function(section){
		var self = _frame.app_main.page['items'].section['类型集合']

		// 新建按钮
			self.dom.new_container = $('<div class="new_container"/>').appendTo( section )
				self.dom.btnnew = $('<button/>').html('新建').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['items'].gen_form_new_item_type_collection(
								function(err, newDoc) {
									self.add(newDoc)
									_frame.modal.hide()
								}
							), '新建类型集合')
					}).appendTo( self.dom.new_container )

		// 列表container
			self.dom.main = $('<div class="main"/>').appendTo( section )

		// 读取db，初始化内容
			_db.item_type_collections.find({}).sort({'id': 1}).exec(function(err, docs){
				if( !err && docs && docs.length ){
					for( var i in docs ){
						self.add(docs[i])
					}
				}
			})
	}
}









_frame.app_main.page['items'].section['新建'] = {
	'dom': {},

	'init': function(section){
		var self = _frame.app_main.page['items'].section['新建']
		self.dom.section = section

		// 创建form
			self.dom.form = $('<form/>')
								.on('submit', function(e){
									e.preventDefault();
									var formdata = self.dom.form.serializeObject()
										,item_data = {
											'name': 	{},
											'stat': 	{},
											'dismantle':[0, 0, 0, 0]
										}

									if( formdata['id'] )
										item_data['id'] = formdata['id']

									_frame.app_main.page['items'].show_item_form(
										item_data
									)
								})
								.data({
									'item_data': {}
								})
								.appendTo( section )

			var id = '_input_g' + _g.inputIndex
			_g.inputIndex++
			$('<p/>')
				.append(
					$('<label for="' +id+ '"/>').html('ID')
				)
				.append(
					$('<input id="' +id+ '" type="number" name="id"/>')
				)
				.appendTo(self.dom.form)

			$('<p class="actions"/>')
								.append(
									$('<button type="submit"/>').html('新建')
								)
								.appendTo(self.dom.form)

	}
}


_frame.app_main.page['entities'] = {}
_frame.app_main.page['entities'].section = {}

_frame.app_main.page['entities'].gen_form_new_entity = function( callback, data_edit, callback_remove ){
	callback = callback || function(){}
	var self = _frame.app_main.page['entities']
		,form = $('<form class="new_entity"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()

					// links
						data['links'] = []
						data.link_name = data.link_name.push ? data.link_name : [data.link_name]
						data.link_url = data.link_url.push ? data.link_url : [data.link_url]
						for( var i in data.link_name ){
							data['links'][i] = {
								'name': data.link_name[i],
								'url': data.link_url[i]
							}
						}
						data.link_name = null
						data.link_url = null
						delete data.link_name
						delete data.link_url

					if( data_edit ){
						// 编辑操作
						_db['entities'].update({
							'_id': 	data_edit['_id']
						}, {
							$set: data
						}, {}, function (err, numReplaced) {
							callback( data )
							_frame.modal.hide()
						});
					}else{
						// 新建操作
						// 获取当前总数，确定数字ID
						// 之后插入数据
							_db['entities'].count({}, function(err, count){
								data['id'] = parseInt(count) + 1
								_db['entities'].insert(
									data,
									callback
								);
							})
					}
				})

	$('<h4/>').html('名称').appendTo(form)
		_frame.app_main.page['ships'].section['舰种&舰级'].field_input_text('name.ja_jp', '日', data_edit ? data_edit['name']['ja_jp'] : null).appendTo(form)
		_frame.app_main.page['ships'].section['舰种&舰级'].field_input_text('name.zh_cn', '简中', data_edit ? data_edit['name']['zh_cn'] : null).appendTo(form)

	_form.section_order(
		'链接',
		function(data, index){
			var line = $('<p/>')
				,id = '_input_g' + _g.inputIndex
				,name = data['name'] || null
				,url = data['url'] || null

			_g.inputIndex++

			$('<label for="'+id+'"/>').appendTo(line)

			_frame.app_main.page['ships'].gen_input(
					'text',
					'link_name',
					id,
					name,
					{'notRequired': true}
				).appendTo(line)

			id = '_input_g' + _g.inputIndex
			_g.inputIndex++
			$('<label for="'+id+'"/>').html( 'URL' ).appendTo(line)
			_frame.app_main.page['ships'].gen_input(
					'text',
					'link_url',
					id,
					url,
					{'notRequired': true}
				).appendTo(line)

			return line
		},
		$.extend(true,
			[
				{
					'name': 'Twitter',
					'url': 	null
				}
			],data_edit ? data_edit['links'] : [])
	).appendTo(form)
		//_frame.app_main.page['ships'].section['舰种&舰级'].field_input_text('name.zh_cn', '简中', data_edit ? data_edit['name']['zh_cn'] : null).appendTo(form)

	_frame.app_main.page['ships'].section['舰种&舰级'].field_actions(
		data_edit ? '更新' : null,
		callback_remove ? function(){
				_db['entities'].remove({ _id: data_edit['_id'] }, {}, function (err, numRemoved) {
					callback_remove()
					_frame.modal.hide()
				});
			} : null
	).appendTo(form)

	return form
}

_frame.app_main.page['entities'].init = function(page){
	page.find('section').on({
		'tabview-show': function(){
			var section = $(this)
				,name = section.data('tabname')

			if( !_frame.app_main.page['entities'].section[name] )
				_frame.app_main.page['entities'].section[name] = {}

			var _o = _frame.app_main.page['entities'].section[name]

			if( !_o.is_init && _o.init ){
				_o.init(section)
				_o.is_init = true
			}
		}
	})
}









_frame.app_main.page['entities'].section['人物&组织'] = {
	'dom': {},

	// 返回HTML内容
		'get_content': function(d){
			return '<strong>' + d['name']['zh_cn'] + '</strong>'
				+ '<small>' + d['name']['ja_jp'] + '</small>'
		},

	// 相关表单/按钮
		'get_titlebtn': function( d ){
			var self = _frame.app_main.page['entities'].section['人物&组织']
				,btn = $('<button class="ship_suffix"/>').html(
						self.get_content(d)
					).on('click', function(){
						_frame.modal.show(
							_frame.app_main.page['entities'].gen_form_new_entity(
								function( newdata ){
									btn.html(self.get_content(newdata))
								},
								d,
								function(){
									btn.remove()
								}
							) , '编辑实体')
					})
			return btn
		},

	// 新建完毕，添加内容
		'added_entity': function( d ){
			var self = _frame.app_main.page['entities'].section['人物&组织']

			// 舰种标题，同时也是编辑按钮
				self.get_titlebtn(d).appendTo( self.dom.section )
		},

	'init': function(section){
		var self = _frame.app_main.page['entities'].section['人物&组织']

		// 新建按钮
			self.dom.new_container = $('<div class="new_container"/>').appendTo( section )
				self.dom.btnnew = $('<button/>').html('新建').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['entities'].gen_form_new_entity(
								function(err, newDoc) {
									self.added_entity(newDoc)
									_frame.modal.hide()
								}
							), '新建实体')
					}).appendTo( self.dom.new_container )

		// 读取实体列表，创建内容
			self.dom.section = $('<div class="main"/>').appendTo(section)
			_db['entities'].find({}).sort({ 'id': 1 }).exec(function(err, docs){
				if( !err ){
					for(var i in docs ){
						self.added_entity(docs[i])
					}
				}
			})

	}
}

_frame.app_main.page['update'] = {}
_frame.app_main.page['update'].section = {}








_frame.app_main.page['update'].field_input_text = function(name, title, value, suffix){
	var line = $('<p/>')
		,label = $('<label/>').appendTo(line)
	$('<span/>').html(title).appendTo(label)
	$('<input type="text" required name="'+name+'" />').val(value).appendTo(label)
	if( suffix )
		$('<span/>').html(suffix).appendTo(label)
	return line
}
_frame.app_main.page['update'].field_input_date = function(name, title, value, suffix){
	var line = $('<p/>')
		,label = $('<label/>').appendTo(line)
	$('<span/>').html(title).appendTo(label)
	$('<input type="date" name="'+name+'" />').val(value).appendTo(label)
	if( suffix )
		$('<span/>').html(suffix).appendTo(label)
	return line
}
_frame.app_main.page['update'].field_input_checkbox = function(name, title, value, suffix){
	var line = $('<p/>')
		,label = $('<label/>').appendTo(line)
	$('<span/>').html(title).appendTo(label)
	$('<input type="checkbox" name="'+name+'" />')
		.prop( 'checked', (value) ? true : false )
		.appendTo(label)
	if( suffix )
		$('<span/>').html(suffix).appendTo(label)
	return line
}
_frame.app_main.page['update'].field_input_textarea = function(name, title, value, suffix){
	var line = $('<p/>')
		,label = $('<label/>').appendTo(line)
	$('<span/>').html(title).appendTo(label)
	$('<textarea required name="'+name+'" />').val(value).attr({
		'cols': 	60,
		'rows': 	20
	}).appendTo(label)
	if( suffix )
		$('<span/>').html(suffix).appendTo(label)
	return line
}
_frame.app_main.page['update'].field_actions = function(text, func_delete){
	var line = $('<p class="actions"/>')
	$('<button type="submit"/>').html(text || '提交').appendTo(line)
	if( func_delete ){
		$('<button type="button"/>').html('删除').on('click', function(){
			func_delete()
		}).appendTo(line)
	}
	return line
}










_frame.app_main.page['update'].gen_form_new_journal = function( callback, data_edit, callback_remove ){
	callback = callback || function(){}
	is_edit = (data_edit)
	var self = this
		,form = $('<form class="update_journal"/>').on('submit',function(e){
					e.preventDefault()
					var data = $(this).serializeObject()

					data['version'] = node.semver.clean( data['version'] )

					console.log(data)
					//return data

					if( is_edit ){
						// 编辑操作
						_db.updates.update({
							'_id': 	data_edit['_id']
						}, {
							$set: data
						}, {}, function (err, numReplaced) {
							callback( data )
							_frame.modal.hide()
						});
					}else{
						// 新建操作
						// 获取当前总数，确定数字ID
						// 之后插入数据
							_db.updates.count({}, function(err, count){
								data['id'] = parseInt(count) + 1
								_db.updates.insert(
									data,
									callback
								);
							})
					}
				})
		,input_container = $('<div/>').appendTo(form)

	_frame.app_main.page['ships'].gen_input(
		'select', 
		'type', 
		null,
		[
			'app',
			'app-db',
			'pics'
		],
		{
			'default': is_edit ? data_edit['type'] : null
		}).insertBefore(input_container)
	self.field_input_text('version', '版本号', is_edit ? data_edit['version'] : null).appendTo(input_container)
	self.field_input_date('date', '更新日', is_edit ? data_edit['date'] : null).appendTo(input_container)
	self.field_input_checkbox('hotfix', null, is_edit ? data_edit['hotfix'] : false, 'HOTFIX ?').appendTo(input_container)
	self.field_input_textarea('journal', '更新日志', is_edit ? data_edit['journal'] : null).appendTo(input_container)

	self.field_actions(
		is_edit ? '更新' : null,
		callback_remove ? function(){
				_db.updates.remove({ _id: data_edit['_id'] }, {}, function (err, numRemoved) {
					callback_remove()
					_frame.modal.hide()
				});
			} : null
	).appendTo(form)
	return form
}

















_frame.app_main.page['update'].init = function(page){
	page.find('section').on({
		'tabview-show': function(){
			var section = $(this)
				,name = section.data('tabname')

			if( !_frame.app_main.page['update'].section[name] )
				_frame.app_main.page['update'].section[name] = {}

			var _o = _frame.app_main.page['update'].section[name]

			if( !_o.is_init && _o.init ){
				_o.init(section)
				_o.is_init = true
			}
		}
	})
}









_frame.app_main.page['update'].section['更新日志'] = {
	'dom': {
	},

	// 相关表单/按钮
		'titlebtn': function( d ){
			var self = this
				,btn = $('<button class="unit"/>').html(
							'<strong>'
								+ d['type'].toUpperCase()
								+ '/'
								+ d['version']
							+ '</strong><br/>'
							+ '<small><em>'+d['date']+'</em></small>'
						)
						.on('click', function(){
							_frame.modal.show(
								_frame.app_main.page['update'].gen_form_new_journal(
									function( newdata ){
										self.titlebtn( newdata )
											.insertAfter( btn )
										btn.remove()
									},
									d,
									function(){
										btn.remove()
									}
								) , '编辑更新日志')
						})
			return btn
		},

	// 新建完毕，添加内容
		'add': function( d ){
			var self = this
			// 标题，同时也是编辑按钮
				self.dom.list.appendDOM( self.titlebtn(d) )
		},

	'init': function(section){
		var self = this

		// 新建按钮
			self.dom.new_container = $('<div class="new_container"/>').appendTo( section )
				self.dom.btnnew = $('<button/>').html('新建').on('click',function(){
						_frame.modal.show(
							_frame.app_main.page['update'].gen_form_new_journal(
								function(err, newDoc) {
									self.add(newDoc)
									_frame.modal.hide()
								}
							), '新建更新日志')
					}).appendTo( self.dom.new_container )

		// 列表container
			self.dom.main = $('<div class="main"/>').appendTo( section )
			self.dom.list = _p.el.flexgrid.create().addClass('update_history').appendTo( self.dom.main )

		// 读取db，初始化内容
			_db.updates.find({}).sort({'date': -1}).exec(function(err, docs){
				if( !err && docs && docs.length ){
					for( var i in docs ){
						self.add(docs[i])
					}
				}
			})
	}
}

// http://203.104.209.23/kcs/...

_frame.app_main.page['gamedata'] = {}
_frame.app_main.page['gamedata'].init = function( page ){
	jf.readFile(node.path.join(_g.root, '/fetched_data/api_start2.json'), function(err, obj) {
		if( err )
			return false

		page.empty()
		_frame.app_main.page['gamedata'].tabview = $('<div class="tabview"/>').appendTo(page)

		_frame.app_main.page['gamedata'].data = obj['api_data']

		console.log(obj)
		for( var i in obj['api_data'] ){
			var item = i.replace('api_mst_', '')
			if( _frame.app_main.page['gamedata']['init_' + item] )
				_frame.app_main.page['gamedata']['init_' + item](obj['api_data'][i])
		}

		_p.initDOM(page)
	})
}

_frame.app_main.page['gamedata'].init_ship = function( data ){
	var section = $('<section class="list" data-tabname="Ships"/>').appendTo(this.tabview)
	//console.log(data)

	/*
		基本信息
			id 			ID
			name 		名
			yomi 		假名
			stype		舰种
						2	驱逐舰
						3	轻巡洋舰
						7	轻航母
			sortno 		图鉴ID
			buildtime	建造时长
			getmes		入手台词
			backs		卡背级别
						3	睦月
						4	深雪改
						5	筑摩改
						6	能代改
		属性
			houg		火力	初始, 最大
			raig		雷装	初始, 最大
			tyku		对空	初始, 最大
			taik		耐久	初始, 最大
			souk		装甲	初始, 最大
			soku 		航速
						5	慢
						10	快
			leng		射程
						1 	短
						2 	中
						3	长
						4 	超长
			luck		运		初始, 最大
		消耗
			fuel_max	燃料
			bull_max	弹药
		装备 & 搭载
			slot_num 	搭载格数
			maxeq		每格搭载量
		改造
			afterlv		改造等级
			aftershipid	改造后ID
			afterfuel	消耗燃料
			afterbull	消耗弹药
		解体
			broken 		ARRAY 解体资源
		合成
			powup 		ARRAY 合成提高属性
		未知
			voicef		睦月		0
						深雪改		1
						能代改		3
	*/

	// 遍历 api_mst_shipgraph，做出文件名和ID对应表
		var filename_map = {}
		for( var i in this.data['api_mst_shipgraph'] ){
			filename_map[this.data['api_mst_shipgraph'][i]['api_id']] = {
				'filename': this.data['api_mst_shipgraph'][i]['api_filename'],
				'version': 	parseInt( this.data['api_mst_shipgraph'][i]['api_version'] )
			}
		}
		console.log(filename_map)

	// 按钮 & 功能: 下载全部舰娘数据文件
		$('<button type="button"/>')
			.html('下载全部数据文件')
			.on('click', function(){
				var promise_chain 	= Q.fcall(function(){})
					,folder = node.path.join(_g.root, '/fetched_data/ships_raw/')
					,folder_pics = node.path.join(_g.root, '/fetched_data/ships_pic/')
					,version_file = node.path.join(folder, '_.json')
					,version_last = {}

				function _log( msg ){
					console.log(msg)
				}

				// 开始异步函数链
					promise_chain

				// 检查并创建工作目录
					.then(function(){
						var deferred = Q.defer()
						node.mkdirp( folder, function(err){
							if( err ){
								_log('创建目录失败 ' + folder)
								deferred.reject(new Error(err))
							}else{
								_log('已确保目录 ' + folder)
								deferred.resolve()
							}
						} )
						return deferred.promise
					})
					.then(function(){
						var deferred = Q.defer()
						node.mkdirp( folder_pics, function(err){
							if( err ){
								_log('创建目录失败 ' + folder_pics)
								deferred.reject(new Error(err))
							}else{
								_log('已确保目录 ' + folder_pics)
								deferred.resolve()
							}
						} )
						return deferred.promise
					})

				// 读取之前的版本号
					.then(function(){
						var deferred = Q.defer()
						jf.readFile(version_file, function(err, obj) {
							version_last = obj || {}
							deferred.resolve()
						})
						return deferred.promise
					})

				// 遍历舰娘数据
					.then(function(){
						_log('开始遍历舰娘数据')
						var count = 0
							,max = _frame.app_main.page['gamedata'].data['api_mst_ship'].length
						_frame.app_main.page['gamedata'].data['api_mst_ship'].forEach(function(data){
							(function(data){
								promise_chain = promise_chain.then(function(){
									var deferred = Q.defer()
										,file = node.url.parse( 'http://'+ server_ip +'/kcs/resources/swf/ships/' + filename_map[data['api_id']]['filename'] + '.swf' )
										,filename = data['api_id'] + ' - ' + data['api_name'] + '.swf'
										,file_local = node.path.join(folder, data['api_id'] + '.swf' )
										,file_local_rename = node.path.join(folder, filename )
										,folder_export = node.path.join(folder_pics, '\\'+data['api_id'] )
										,stat = null
										,version = filename_map[data['api_id']]['version'] || 0
										,skipped = false
										,statusCode = null

									try{
										var stat = node.fs.lstatSync(file_local_rename)
										if( !stat || !stat.isFile() ){
											stat = null
										}
									}catch(e){}

									_log('========== ' + count + '/' + max + ' ==========')
									_log('    [' + data['api_id'] + '] ' + data['api_name']
										+ ' | 服务器版本: ' + version
										+ ' | 本地版本: ' + ( version_last[data['api_id']] || '无' )
									)

									if( stat && version <= (version_last[data['api_id']] || -1) ){
										skipped = true
										_log('    本地版本已最新，跳过')
										count++
										deferred.resolve()
									}else{
										_log('    开始获取: ' + file.href)
										version_last[data['api_id']] = version

										Q.fcall(function(){})

										// 向服务器请求 swf 文件
											.then(function(){
												var deferred2 = Q.defer()
												request({
													'uri': 		file,
													'method': 	'GET',
													'proxy': 	proxy
												}).on('error',function(err){
													deferred2.reject(new Error(err))
												}).on('response', function(response){
													statusCode = response.statusCode
												}).pipe(
													node.fs.createWriteStream(file_local)
														.on('finish', function(){
															_log('    文件已保存: ' + data['api_id'] + ' - ' + data['api_name'] + '.swf')
															count++
															jf.writeFile(version_file, version_last, function(err) {
																if(err){
																	deferred2.reject(new Error(err))
																}else{
																	_log('    版本文件已更新')
																	deferred2.resolve()
																}
															})
															if( statusCode != 200 || data['api_name'] == 'なし' ){
																skipped = true
															}
														})
												)
												return deferred2.promise
											})

										// 反编译 swf
											.then(function(){
												var deferred2 = Q.defer()
												if( skipped ){
													deferred2.resolve()
												}else{
													_log('    开始反编译 SWF')
													var exec = node.require('child_process').exec
														,child

													node.mkdirp.sync(folder_export)
													_log('    目录已确保 ' + folder_export)

													child = exec(
														'java -jar .\\app\\assets\\FFDec\\ffdec.jar'
														+ ' -format image:png'
														+ ' -export image ' + folder_export
														+ ' ' + file_local,
														function (err, stdout, stderr) {
															_log('    stdout: ' + stdout);
															_log('    stderr: ' + stderr);
															if (err !== null) {
																_log('    exec error: ' + err);
																deferred2.reject(new Error(err))
															}else{
																_log('    SWF 反编译完成')
																deferred2.resolve()
															}
														});
												}
												return deferred2.promise
											})

										// 如果执行了 swf 反编译，整理反编译结果
											.then(function(){
												var deferred2 = Q.defer()
												if( skipped ){
													deferred2.resolve()
												}else{
													node.fs.readdir(folder_export, function(err, files){
														if( err ){
															deferred2.reject(new Error(err))
														}else{
															deferred2.resolve(files)
														}
													})
												}
												return deferred2.promise
											})
											.then(function(files){
												var chain2 = Q.fcall(function(){})
													,deferred2 = Q.defer()
													,count2 = 0

												files = files || []
												files = files.sort(function(a, b){
													var name_a = parseInt( a ) || -999
														,name_b = parseInt( b ) || -999
													return name_a - name_b
												})

												if( files.length ){
													files.forEach(function(_filename){
														(function(_filename, count2){
															chain2 = chain2.then(function(){
																var deferred3 = Q.defer()
																	,parsed = node.path.parse(_filename)
																	,new_name = Math.floor(parseInt(parsed['name']) / 2) + parsed['ext'].toLowerCase()
																	,_path = node.path.join( folder_export, _filename )
																if( node.fs.lstatSync( _path ).isFile() ){
																	node.fs.rename(
																		_path,
																		node.path.join( folder_export, new_name ),
																		function(err){
																			if (err !== null) {
																				deferred3.reject(new Error(err))
																			}else{
																				_log('    反编译: ' + new_name )
																				deferred3.resolve()
																			}
																			if( count2 >= files.length - 1 ){
																				deferred2.resolve()
																			}
																		}
																	)
																}else{
																	deferred3.resolve()
																	if( count2 >= files.length - 1 ){
																		deferred2.resolve()
																	}
																}
															})
														})( _filename, count2 )
														count2++
													})
												}else{
													deferred2.resolve()
												}

												return deferred2.promise
											})

										// 重命名本地 swf
											.then(function(){
												var deferred2 = Q.defer()
												node.fs.rename(
													file_local,
													file_local_rename,
													function(err){
														if (err !== null) {
															deferred2.reject(new Error(err))
														}else{
															_log('    SWF 文件重命名为 ' + filename )
															deferred2.resolve()
														}
													}
												)
												return deferred2.promise
											})
											.catch(function (err) {
												_log(err)
												deferred.reject(new Error(err))
											})
											.done(function(){
												deferred.resolve()
											})
									}

									return deferred.promise
								})
							})(data)
						})
						return true
					})
				
				// 错误处理
					.catch(function (err) {
						_log(err)
					})
					.done(function(){
						_log('ALL DONE')
					})
			}).appendTo( section )

	// 按钮 & 功能: 根据游戏数据更新舰娘数据库
		$('<button type="button"/>')
			.html('更新舰娘数据库')
			.on('click', function(){
				var promise_chain 	= Q.fcall(function(){})

				function _log( msg ){
					console.log(msg)
				}

				// 开始异步函数链
					promise_chain

				// 获取全部 _id & id
					.then(function(){
						var deferred = Q.defer()
						_db.ships.find({}, function(err, docs){
							if( err ){
								deferred.reject(err)
							}else{
								var d = {}
								for(var i in docs){
									d[docs[i].id] = docs[i]._id
								}
								deferred.resolve(d)
							}
						})
						return deferred.promise
					})

				// 更新数据
					.then(function(map){
						_log(map)
						_log('开始遍历舰娘数据')

						var count = 0
							,max = _frame.app_main.page['gamedata'].data['api_mst_ship'].length

						_frame.app_main.page['gamedata'].data['api_mst_ship'].forEach(function(data){
							(function(data){
								function _done( cur ){
									if(cur >= max){
										promise_chain.fin(function(){
											_log('遍历舰娘数据完成')
										})
									}
								}
								promise_chain = promise_chain.then(function(){
									var deferred = Q.defer()
									if( map[data.api_id] ){
										_log('    [' + data.api_id + '] ' + data.api_name + ' 开始处理')
										count++

										var modified = {}
										// base
											modified['no'] 			= data['api_sortno']
											modified['buildtime'] 	= data['api_buildtime']
											modified['lines.start'] = data['api_getmes']
											modified['rare'] 		= data['api_backs']
										// stat
											modified['stat.fire'] 			= data['api_houg'][0]
											modified['stat.fire_max'] 		= data['api_houg'][1]
											modified['stat.torpedo'] 		= data['api_raig'][0]
											modified['stat.torpedo_max']	= data['api_raig'][1]
											modified['stat.aa'] 			= data['api_tyku'][0]
											modified['stat.aa_max'] 		= data['api_tyku'][1]
											modified['stat.hp'] 			= data['api_taik'][0]
											modified['stat.hp_max'] 		= data['api_taik'][1]
											modified['stat.armor'] 			= data['api_souk'][0]
											modified['stat.armor_max'] 		= data['api_souk'][1]
											modified['stat.speed'] 			= data['api_soku']
											modified['stat.range'] 			= data['api_leng']
											modified['stat.luck'] 			= data['api_luck'][0]
											modified['stat.luck_max'] 		= data['api_luck'][1]
										// consum
											modified['consum.fuel'] 		= data['api_fuel_max']
											modified['consum.ammo'] 		= data['api_bull_max']
										// slot
											var i = 0
											modified['slot'] = []
											while( i < (parseInt( data['api_slot_num'] ) || 0) ){
												modified['slot'].push( data['api_maxeq'][i] || 0 )
												i++
											}
										// remodel
											modified['remodel_cost.fuel']	= data['api_afterfuel']
											modified['remodel_cost.ammo']	= data['api_afterbull']
										// misc
											modified['scrap']				= data['api_broken']
											modified['modernization']		= data['api_powup']
											modified['time_modified'] 		= _g.timeNow()

										_log( modified )
										_db.ships.update({
											'_id': map[data['api_id']]
										}, {
											$set: modified
										}, function(){
											deferred.resolve()
											_done(count)
										})
									}else{
										_log('    [' + data.api_id + '] ' + data.api_name + ' 不存在于数据库，跳过')
										count++
										deferred.resolve()
										_done(count)
									}
									return deferred.promise
								})
							})(data)
						})
						return true
					})
				
				// 错误处理
					.catch(function (err) {
						_log(err)
					})
					.done(function(){
						_log('ALL DONE')
					})
			}).appendTo( section )
}

_frame.app_main.page['gamedata'].init_slotitem = function( data ){
	var section = $('<section class="list" data-tabname="Equipments"/>').appendTo(this.tabview)

	for( var i in data ){
		/*
			基本信息
				id 			装备ID
				sortno 		图鉴ID
				name 		装备名
				info 		装备描述
				rare 		稀有度
			属性
				houg		火力
				raig		雷装
				tyku		对空
				tais		对潜
				taik		耐久
				saku 		索敌
				souk		装甲
				soku 		航速
				luck		运
				leng		射程
							1 	短
							2 	中
							3	长
							4 	超长
				houk		回避
				houm		命中
				baku		爆装
			解体
				broken 		ARRAY 解体资源
			未知
				atap
				bakk
				raik
				raim
				sakb
				type
				usebull
		*/
		(function( d ){
			var dom = $('<section/>').appendTo(section)
				,checkbox = $('<input type="checkbox" id="rawdata_slotitem_'+d['api_id']+'"/>').appendTo(dom)
				,title = $('<label for="rawdata_slotitem_'+d['api_id']+'"/>').html('[#' + d['api_id'] + '] ' + d['api_name']).appendTo(dom)

			_db.items.find({'id': d['api_id']}, function(err, docs){
				if( err || !docs.length ){
					// 数据库中不存在
						dom.addClass('new')
						$('<button/>').on('click', function(){
									_frame.app_main.page['items'].show_item_form({
										'id': 		d['api_id'],
										'rarity': 	d['api_rare'],
										'name': 	{
											'ja_jp': 	d['api_name']
										},
										'stat': 	{
											'fire': 	d['api_houg'],
											'torpedo': 	d['api_raig'],
											'bomb': 	d['api_baku'],
											'asw': 		d['api_tais'],
											'aa': 		d['api_tyku'],
											'armor': 	d['api_souk'],
											'evasion': 	d['api_houk'],
											'hit': 		d['api_houm'],
											'los': 		d['api_saku'],
											'range': 	d['api_leng']
										},
										'dismantle':d['api_broken']
									})
						}).html('录入').appendTo(dom)
					// http://203.104.209.23/kcs/resources/image/slotitem/card/139.png
				}else if( !err ){
					// 对比数据
						//console.log(docs[0], d)
				}
			})
		})(data[i])
	}
}

_form.section_order = function( name, function_line, defaults ){
	var section = $('<section class="form_section" data-name="'+name+'"/>')
					.append( $('<h4>' + name + '</h4>') )
		,defaults = defaults || []
		//,pointer = 0
		,length = 0
		//,exists = parseInt( defaults ? defaults.length : 0 )
		,btn_add_link = $('<button class="add" type="button"/>').on('click', function(){
						appendLine({}, length)
					}).html('添加' + name).appendTo(section)

	function refreshAll(){
		var sections = section.children('.line').removeClass('first last')
		sections.eq(0).addClass('first')
		sections.eq(-1).addClass('last')
	}

	function appendLine(data, index){
		index = parseInt( index || 0 )
		var line = function_line( data || {}, index )
						.addClass('line line-sortable')
						.data({
							'index': 	parseInt( index )
						})
						.insertBefore(btn_add_link)
						//.appendTo( section )
			,btns = $('<span class="btns"/>').appendTo(line)

		// button: move up
			,btn_up = $('<button class="up" type="button"/>')
						.html('&#8679')
						.on('click', function(){
							var indexCur = line.data('index')
							if( indexCur <= 0 )
								return false
							var lineAhead = line.prev()
							line.insertBefore( lineAhead )
								.data('index', indexCur - 1 )
							lineAhead.data('index', indexCur )
							refreshAll()
						})
						.appendTo(btns)

		// button: move down
			,btn_down = $('<button class="down" type="button"/>')
						.html('&#8681')
						.on('click', function(){
							var indexCur = line.data('index')
							if( indexCur >= length - 1 )
								return false
							var lineBehind = line.next()
							line.insertAfter( lineBehind )
								.data('index', indexCur + 1 )
							lineBehind.data('index', indexCur )
							refreshAll()
						})
						.appendTo(btns)

		// button: delete
			,btn_delete = $('<button class="delete" type="button"/>')
						.html('&times;')
						.on('click', function(){
							line.remove()
							line.nextAll().each(function(){
								var indexCur = $(this).data('index')
								$(this).data('index', indexCur-1)
							})
							length--
							refreshAll()
						})
						.appendTo(btns)

		length++
		refreshAll()
		return line
	}

	for( var i in defaults )
		appendLine(defaults[i], i)

	return section
}












_form.create_equip_types = function(name, defaults){
	var itemtype_checkboxes = _p.el.flexgrid.create().addClass('item_types')
	defaults = defaults || []
	_db.item_types.find({}).sort({'id': 1}).exec(function(err, docs){
		for(var i in docs ){
			var type_id = parseInt(docs[i]['id'])
				,input_id = '_input_g' + _g.inputIndex
				,unitDOM = $('<div class="unit"/>')
			itemtype_checkboxes.appendDOM(unitDOM)
			_g.inputIndex++
			$('<input type="checkbox" name="'+name+'" value="'+type_id+'" id="'+input_id+'">')
				.prop('checked', ($.inArray(type_id, defaults) > -1) )
				.appendTo( unitDOM )
			$('<label for="'+input_id+'"/>')
				.html(
					'<span style="background-image: url(../app/assets/images/itemicon/transparent/'+docs[i]['icon']+'.png)"></span>'
					+ docs[i]['name']['zh_cn']
				)
				.appendTo(unitDOM)
		}
	})

	return itemtype_checkboxes
}
_form.create_item_types = _form.create_equip_types

_comp.selector_equipment = function( name, id, default_item ){
	var dom = _frame.app_main.page['ships'].gen_input(
			'select',
			name || null,
			id || null,
			[]
		)
		,equipments = []
		,options = []

	_db.item_types.find({}).sort({'id': 1}).exec(function(err, docs){
		if( !err && docs && docs.length ){
			for( var i in docs ){
				equipments[docs[i]['id']] = [
					docs[i]['name']['zh_cn'],
					[]
				]
			}
			_db.items.find({}).sort({ 'type': 1, 'rarity': 1, 'id': 1 }).exec(function(err, docs){
				for(var i in docs ){
					//equipments[docs[i]['type']][1].push(docs[i])
					equipments[docs[i]['type']][1].push({
							'name': 	docs[i]['name']['zh_cn'],
							'value': 	docs[i]['id']
						})
				}

				for( var i in equipments ){
					options.push({
						'name': 	'=====' + equipments[i][0] +  '=====',
						'value': 	''
					})
					for( var j in equipments[i][1] ){
						options.push({
							'name': 	equipments[i][1][j]['name']['zh_cn'],
							'value': 	equipments[i][1][j]['id']
						})
					}
				}
				//console.log( equipments )
				//console.log( options )

				_frame.app_main.page['ships'].gen_input(
					'select_group',
					dom.attr('name'),
					dom.attr('id'),
					equipments,
					{
						'default': default_item
					}).insertBefore(dom)
				dom.remove()
			})
		}
	})
	return dom
}


_comp.selector_ship = function( name, id, default_item ){
	var dom = _frame.app_main.page['ships'].gen_input(
			'select',
			name || null,
			id || null,
			[]
		)
		,ships = []

	_db.ships.find({}).sort({'type': 1, 'class': 1, 'class_no': 1, 'time_created': 1, 'name.suffix': 1}).exec(function(err, docs){
		if( !err && !_g.data.ship_id_by_type.length ){
			for(var i in docs){
				_g.data.ships[docs[i]['id']] = docs[i]

				if( typeof _g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ] == 'undefined' )
					_g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ] = []
				_g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ].push( docs[i]['id'] )
			}
		}

		for( var i in _g.data.ship_id_by_type ){
			if( typeof _g.ship_type_order[i] == 'object' ){
				var data_shiptype = _g.data.ship_types[ _g.ship_type_order[i][0] ]
			}else{
				var data_shiptype = _g.data.ship_types[ _g.ship_type_order[i] ]
			}

			ships[i] = [
				_g.ship_type_order_name[i]['zh_cn'] + ' [' + data_shiptype['code'] + ']',
				[]
			]

			for( var j in _g.data.ship_id_by_type[i] ){
				var d = _g.data.ships[ _g.data.ship_id_by_type[i][j] ]
				ships[i][1].push({
						'name': 	(d['name']['zh_cn'] || d['name']['ja_jp'])
									+ (d['name']['suffix']
										? '・' + _g.data.ship_namesuffix[d['name']['suffix']]['zh_cn']
										: ''),
						'value': 	_g.data.ship_id_by_type[i][j]
					})
			}
		}

		_frame.app_main.page['ships'].gen_input(
			'select_group',
			dom.attr('name') || null,
			dom.attr('id') || null,
			ships,
			{
				'default': default_item || null
			}).insertBefore(dom)
		dom.remove()
	})

	return dom
}


/*
 */
_p.el.shiplist = {
	init_el: function(el){
		if( el.data('shiplist') )
			return true

		el.data({
			'shiplist': new _shiplist( el )
		})
	},

	init: function(tar, els){
		tar = tar || $('body');
		els = els || tar.find('section.shiplist')

		els.each(function(){
			_p.el.shiplist.init_el($(this))
		})
	}
}






var _shiplist = function( section, options ){
	this.dom = {
		'section': 	section
	}

	this.columns = [
			'  ',
			['火力',	'fire'],
			['雷装',	'torpedo'],
			['对空',	'aa'],
			['对潜',	'asw'],
			['耐久',	'hp'],
			['装甲',	'armor'],
			['回避',	'evasion'],
			['搭载',	'carry'],
			['航速',	'speed'],
			['射程',	'range'],
			['索敌',	'los'],
			['运',		'luck'],
			['油耗',	'consum_fuel'],
			['弹耗',	'consum_ammo']
		]

	this.init();
}

_shiplist.prototype.append_ship = function( ship_data ){
	var self = this
		,tr = $('<tr data-shipid="'+ ship_data['id'] +'" data-shipedit="' + (self.dom.section.hasClass('shiplist-edit')) + '"/>')
				.appendTo( this.dom.tbody )
		,max_carry = 0
		,name = ship_data['name']['zh_cn']
				+ (ship_data['name']['suffix']
					? '<small>' + _g.data.ship_namesuffix[ship_data['name']['suffix']]['zh_cn'] + '</small>'
					: '')

	for( var i in ship_data['carry'] ){
		max_carry+= ship_data['carry'][i]
	}

	function _val( val ){
		if( val == 0 || val == '0' )
			return '<small class="zero">-</small>'
		return val
	}

	for( var i in self.columns ){
		switch( self.columns[i][1] ){
			case ' ':
				$('<th/>')
					.html(
						'<img src="../pics/ships/'+ship_data['id']+'/0.png"/>'
						+ '<strong>' + name + '</strong>'
						//+ '<small>' + ship_data['pron'] + '</small>'
					).appendTo(tr)
				break;
			case 'fire':
				$('<td class="stat-fire"/>').html(_val( ship_data['stat']['fire_max'] )).appendTo(tr)
				break;
			case 'torpedo':
				$('<td class="stat-torpedo"/>').html(_val( ship_data['stat']['torpedo_max'] )).appendTo(tr)
				break;
			case 'aa':
				$('<td class="stat-aa"/>').html(_val( ship_data['stat']['aa_max'] )).appendTo(tr)
				break;
			case 'asw':
				$('<td class="stat-asw"/>').html(_val( ship_data['stat']['asw_max'] )).appendTo(tr)
				break;
			case 'hp':
				$('<td class="stat-hp"/>').html(_val( ship_data['stat']['hp'] )).appendTo(tr)
				break;
			case 'armor':
				$('<td class="stat-armor"/>').html(_val( ship_data['stat']['armor_max'] )).appendTo(tr)
				break;
			case 'evasion':
				$('<td class="stat-evasion"/>').html(_val( ship_data['stat']['evasion_max'] )).appendTo(tr)
				break;
			case 'carry':
				$('<td class="stat-carry"/>').html(_val( ship_data['stat']['carry'] )).appendTo(tr)
				break;
			case 'speed':
				$('<td class="stat-speed"/>').html( _g.getStatSpeed( ship_data['stat']['speed'] ) ).appendTo(tr)
				break;
			case 'range':
				$('<td class="stat-range"/>').html( _g.getStatRange( ship_data['stat']['range'] ) ).appendTo(tr)
				break;
			case 'los':
				$('<td class="stat-los"/>').html(_val( ship_data['stat']['los_max'] )).appendTo(tr)
				//$('<td class="stat-los"/>').html(ship_data['stat']['los'] + '<sup>' + ship_data['stat']['los_max'] + '</sup>').appendTo(tr)
				break;
			case 'luck':
				$('<td class="stat-luck"/>').html(ship_data['stat']['luck'] + '<sup>' + ship_data['stat']['luck_max'] + '</sup>').appendTo(tr)
				break;
			case 'consum_fuel':
				$('<td class="stat-consum_fuel"/>').html(ship_data['consum']['fuel']).appendTo(tr)
				break;
			case 'consum_ammo':
				$('<td class="stat-consum_ammo"/>').html(ship_data['consum']['ammo']).appendTo(tr)
				break;
		}
	}

	// 检查数据是否存在 remodel_next
	// 如果 remodel_next 与当前数据 type & name 相同，标记当前为可改造前版本
	if( ship_data.remodel_next
		&& _g.data.ships[ ship_data.remodel_next ]
		&& _g.ship_type_order_map[ship_data['type']] == _g.ship_type_order_map[_g.data.ships[ ship_data.remodel_next ]['type']]
		&& ship_data['name']['ja_jp'] == _g.data.ships[ ship_data.remodel_next ]['name']['ja_jp']
	){
		tr.addClass('premodeled')
	}

	return tr
}

_shiplist.prototype.append_ship_all = function(){
	var self = this
	for( var i in _g.data.ship_id_by_type ){
		if( typeof _g.ship_type_order[i] == 'object' ){
			var data_shiptype = _g.data.ship_types[ _g.ship_type_order[i][0] ]
		}else{
			var data_shiptype = _g.data.ship_types[ _g.ship_type_order[i] ]
		}
		$('<tr class="typetitle"><th colspan="' + (self.columns.length + 1) + '">'
			//+ data_shiptype['full_zh']
			+ _g.ship_type_order_name[i]['zh_cn']
			+ '<small>[' + data_shiptype['code'] + ']</small>'
			+ '</th></tr>')
			.appendTo( this.dom.tbody )

		for( var j in _g.data.ship_id_by_type[i] ){
			self.append_ship( _g.data.ships[ _g.data.ship_id_by_type[i][j] ] )
		}

		var k = 0
		while(k < 9){
			$('<tr class="empty"/>').appendTo(this.dom.tbody)
			k++
		}
	}
}

_shiplist.prototype.append_option = function( type, name, label, value, suffix, options ){
	options = options || {}
	function gen_input(){
		switch( type ){
			case 'text':
			case 'number':
			case 'hidden':
				var input = $('<input type="'+type+'" name="'+name+'" id="'+id+'" />').val(value)
				break;
			case 'select':
				var input = $('<select name="'+name+'" id="'+id+'" />')
				var option_empty = $('<option value=""/>').html('').appendTo( input )
				for( var i in value ){
					if( typeof value[i] == 'object' ){
						var o_el = $('<option value="' + (typeof value[i].val == 'undefined' ? value[i]['value'] : value[i].val) + '"/>')
							.html(value[i]['title'] || value[i]['name'])
							.appendTo( input )
					}else{
						var o_el = $('<option value="' + value[i] + '"/>')
							.html(value[i])
							.appendTo( input )
					}
					if( typeof options['default'] != 'undefined' && o_el.val() == options['default'] ){
						o_el.prop('selected', true)
					}
				}
				if( !value || !value.length ){
					option_empty.remove()
					$('<option value=""/>').html('...').appendTo( input )
				}
				if( options['new'] ){
					$('<option value=""/>').html('==========').insertAfter( option_empty )
					$('<option value="___new___"/>').html('+ 新建').insertAfter( option_empty )
					input.on('change.___new___', function(){
						var select = $(this)
						if( select.val() == '___new___' ){
							select.val('')
							options['new']( input )
						}
					})
				}
				break;
			case 'checkbox':
				var input = $('<input type="'+type+'" name="'+name+'" id="'+id+'" />').prop('checked', value)
				break;
			case 'radio':
				var input = $();
				for( var i in value ){
					var title, val
						,checked = false
					if( value[i].push ){
						val = value[i][0]
						title = value[i][1]
					}else{
						val = value[i].val || value[i].value
						title = value[i].title || value[i].name
					}
					if( options.radio_default && options.radio_default == val )
						checked = true
					input = input.add(
						$('<input type="radio" name="'+name+'" id="'+id+'-'+val+'" ischecked="'+checked+'" />')
							.val(val)
							.prop('checked', (checked || (!checked && i == 0) ))
						)
					input = input.add($('<label for="'+id+'-'+val+'"/>').html( title ))
				}
				break;
		}

		if( options.required ){
			input.prop('required', true)
		}

		if( options.onchange ){
			input.on('change.___onchange___', function(e){
				options.onchange( e, $(this) )
			})
			if( options['default'] )
				input.trigger('change')
		}

		if( !name )
			input.attr('name', null)

		return input
	}

	var line = $('<p/>').appendTo( this.dom.filter )
		,id = '_input_g' + _g.inputIndex

		,label = label ? $('<label for="'+id+'"/>').html( label ).appendTo(line) : null
		,input = gen_input().appendTo(line)

	if( type == 'checkbox' && label )
		label.insertAfter(input)

	if( suffix )
		$('<label for="'+id+'"/>').html(suffix).appendTo(line)

	_g.inputIndex++
	return line
}

_shiplist.prototype.init = function(){
	if( this.is_init )
		return true

	var self = this

	// 生成过滤器与选项
		this.dom.filter_container = $('<div class="filter"/>').appendTo( this.dom.section )
		this.dom.filter = $('<div/>').appendTo( this.dom.filter_container )

	// 初始化设置
		this.append_option( 'checkbox', 'hide-premodel', '仅显示同名、同种舰最终版本',
			_config.get( 'shiplist-filter-hide-premodel' ) === 'false' ? null : true, null, {
				'onchange': function( e, input ){
					_config.set( 'shiplist-filter-hide-premodel', input.prop('checked') )
					self.dom.filter_container.attr('filter-hide-premodel', input.prop('checked'))
				}
			} )
		this.append_option( 'radio', 'viewtype', null, [
				['list', '列表'],
				['card', '卡片']
			], null, {
				'radio_default': _config.get( 'shiplist-viewtype' ),
				'onchange': function( e, input ){
					if( input.is(':checked') ){
						_config.set( 'shiplist-viewtype', input.val() )
						self.dom.filter_container.attr('viewtype', input.val())
					}
				}
			} )
		this.dom.filter.find('input').trigger('change')

	// 生成表格框架
		this.dom.table_container = $('<div class="fixed-table-container"/>').appendTo( this.dom.section )
		this.dom.table_container_inner = $('<div class="fixed-table-container-inner"/>').appendTo( this.dom.table_container )
		this.dom.table = $('<table class="ships hashover hashover-column"/>').appendTo( this.dom.table_container_inner )
		function gen_thead(arr){
			var thead = $('<thead/>')
				,tr = $('<tr/>').appendTo(thead)
			for(var i in arr){
				if( typeof arr[i] == 'object' ){
					$('<td class="stat-' + arr[i][1] + '"/>').html('<div class="th-inner">'+arr[i][0]+'</div>').appendTo(tr)
				}else{
					$('<th/>').html('<div class="th-inner">'+arr[i]+'</div>').appendTo(tr)
				}
			}
			return thead
		}
		gen_thead( self.columns ).appendTo( this.dom.table )
		this.dom.tbody = $('<tbody/>').appendTo( this.dom.table )

	// 获取所有舰娘数据，按舰种顺序 (_g.ship_type_order / _g.ship_type_order_map) 排序
	// -> 获取舰种名称
	// -> 生成舰娘DOM
		_db.ships.find({}).sort({'type': 1, 'class': 1, 'class_no': 1, 'time_created': 1, 'name.suffix': 1}).exec(function(err, docs){
			if( !err && !_g.data.ship_id_by_type.length ){
				for(var i in docs){
					_g.data.ships[docs[i]['id']] = docs[i]

					if( typeof _g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ] == 'undefined' )
						_g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ] = []
					_g.data.ship_id_by_type[ _g.ship_type_order_map[docs[i]['type']] ].push( docs[i]['id'] )
				}
			}

			_db.ship_types.find({}, function(err2, docs2){
				if( !err2 ){
					for(var i in docs2 ){
						_g.data.ship_types[docs2[i]['id']] = docs2[i]
					}

					if( docs && docs.length ){
						self.append_ship_all()
					}else{
						$('<p/>').html('暂无数据...').appendTo( self.dom.table_container_inner )
					}
				}
			})
		})

	this.is_init = true
}


/*
 */
_p.el.itemlist = {
	init_el: function(el){
		if( el.data('itemlist') )
			return true

		el.data({
			'itemlist': new _itemlist( el )
		})
	},

	init: function(tar, els){
		tar = tar || $('body');
		els = els || tar.find('section.itemlist')

		els.each(function(){
			_p.el.itemlist.init_el($(this))
		})
	}
}






var _itemlist = function( section, options ){
	this.dom = {
		'section': 	section
	}

	this.columns = [
			'  ',
			['火力',	'fire'],
			['雷装',	'torpedo'],
			['爆装',	'bomb'],
			['对潜',	'asw'],
			['对空',	'aa'],
			['装甲',	'armor'],
			['回避',	'evasion'],
			['命中',	'hit'],
			['索敌',	'los'],
			['射程',	'range']
		]

	this.init();
}

_itemlist.prototype.append_item = function( item_data ){
	var self = this
		,tr = $('<tr data-itemid="'+ item_data['id'] +'" data-itemedit="' + (self.dom.section.hasClass('itemlist-edit')) + '"/>')
				.appendTo( this.dom.tbody )
		,max_carry = 0
		,name = item_data['name']['zh_cn']

	function _val( val ){
		if( val == 0 || val == '0' )
			return '<small class="zero">-</small>'
		return val
	}

	for( var i in self.columns ){
		switch( self.columns[i][1] ){
			case ' ':
				$('<th/>')
					.html(
						'<span style="background-image: url(../app/assets/images/itemicon/transparent/'+_g.data.item_types[item_data['type']]['icon']+'.png)"></span>'
						+ '<strong>' + name + '</strong>'
					).appendTo(tr)
				break;
			case 'fire':
				$('<td class="stat-fire"/>').html(_val( item_data['stat']['fire'] )).appendTo(tr)
				break;
			case 'torpedo':
				$('<td class="stat-torpedo"/>').html(_val( item_data['stat']['torpedo'] )).appendTo(tr)
				break;
			case 'bomb':
				$('<td class="stat-bomb"/>').html(_val( item_data['stat']['bomb'] )).appendTo(tr)
				break;
			case 'asw':
				$('<td class="stat-asw"/>').html(_val( item_data['stat']['asw'] )).appendTo(tr)
				break;
			case 'aa':
				$('<td class="stat-aa"/>').html(_val( item_data['stat']['aa'] )).appendTo(tr)
				break;
			case 'armor':
				$('<td class="stat-armor"/>').html(_val( item_data['stat']['armor'] )).appendTo(tr)
				break;
			case 'evasion':
				$('<td class="stat-evasion"/>').html(_val( item_data['stat']['evasion'] )).appendTo(tr)
				break;
			case 'hit':
				$('<td class="stat-hit"/>').html(_val( item_data['stat']['hit'] )).appendTo(tr)
				break;
			case 'los':
				$('<td class="stat-los"/>').html(_val( item_data['stat']['los'] )).appendTo(tr)
				break;
			case 'range':
				$('<td class="stat-range"/>').html( _g.getStatRange( item_data['stat']['range'] ) ).appendTo(tr)
				break;
		}
	}

	return tr
}

_itemlist.prototype.append_item_all = function(){
	var self = this
	for( var i in self.items ){
		self.append_item( _g.data.items[ self.items[i] ] )
	}

	var k = 0
	while(k < 9){
		$('<tr class="empty"/>').appendTo(this.dom.tbody)
		k++
	}
}

_itemlist.prototype.append_option = function( type, name, label, value, suffix, options ){
	options = options || {}
	function gen_input(){
		switch( type ){
			case 'text':
			case 'number':
			case 'hidden':
				var input = $('<input type="'+type+'" name="'+name+'" id="'+id+'" />').val(value)
				break;
			case 'select':
				var input = $('<select name="'+name+'" id="'+id+'" />')
				var option_empty = $('<option value=""/>').html('').appendTo( input )
				for( var i in value ){
					if( typeof value[i] == 'object' ){
						var o_el = $('<option value="' + (typeof value[i].val == 'undefined' ? value[i]['value'] : value[i].val) + '"/>')
							.html(value[i]['title'] || value[i]['name'])
							.appendTo( input )
					}else{
						var o_el = $('<option value="' + value[i] + '"/>')
							.html(value[i])
							.appendTo( input )
					}
					if( typeof options['default'] != 'undefined' && o_el.val() == options['default'] ){
						o_el.prop('selected', true)
					}
				}
				if( !value || !value.length ){
					option_empty.remove()
					$('<option value=""/>').html('...').appendTo( input )
				}
				if( options['new'] ){
					$('<option value=""/>').html('==========').insertAfter( option_empty )
					$('<option value="___new___"/>').html('+ 新建').insertAfter( option_empty )
					input.on('change.___new___', function(){
						var select = $(this)
						if( select.val() == '___new___' ){
							select.val('')
							options['new']( input )
						}
					})
				}
				break;
			case 'checkbox':
				var input = $('<input type="'+type+'" name="'+name+'" id="'+id+'" />').prop('checked', value)
				break;
			case 'radio':
				var input = $();
				for( var i in value ){
					var title, val
						,checked = false
					if( value[i].push ){
						val = value[i][0]
						title = value[i][1]
					}else{
						val = value[i].val || value[i].value
						title = value[i].title || value[i].name
					}
					if( options.radio_default && options.radio_default == val )
						checked = true
					input = input.add(
						$('<input type="radio" name="'+name+'" id="'+id+'-'+val+'" ischecked="'+checked+'" />')
							.val(val)
							.prop('checked', (checked || (!checked && i == 0) ))
						)
					input = input.add($('<label for="'+id+'-'+val+'"/>').html( title ))
				}
				break;
		}

		if( options.required ){
			input.prop('required', true)
		}

		if( options.onchange ){
			input.on('change.___onchange___', function(e){
				options.onchange( e, $(this) )
			})
			if( options['default'] )
				input.trigger('change')
		}

		if( !name )
			input.attr('name', null)

		return input
	}

	var line = $('<p/>').appendTo( this.dom.filter )
		,id = '_input_g' + _g.inputIndex

		,label = label ? $('<label for="'+id+'"/>').html( label ).appendTo(line) : null
		,input = gen_input().appendTo(line)

	if( type == 'checkbox' && label )
		label.insertAfter(input)

	if( suffix )
		$('<label for="'+id+'"/>').html(suffix).appendTo(line)

	_g.inputIndex++
	return line
}

_itemlist.prototype.init = function(){
	if( this.is_init )
		return true

	var self = this
	self.items = []

	// 生成过滤器与选项
		this.dom.filter_container = $('<div class="filter"/>').appendTo( this.dom.section )
		this.dom.filter = $('<div/>').appendTo( this.dom.filter_container )

	// 初始化设置
		this.append_option( 'radio', 'viewtype', null, [
				['list', '列表'],
				['card', '卡片']
			], null, {
				'radio_default': _config.get( 'itemlist-viewtype' ),
				'onchange': function( e, input ){
					if( input.is(':checked') ){
						_config.set( 'itemlist-viewtype', input.val() )
						self.dom.filter_container.attr('viewtype', input.val())
					}
				}
			} )
		this.dom.filter.find('input').trigger('change')

	// 生成表格框架
		this.dom.table_container = $('<div class="fixed-table-container"/>').appendTo( this.dom.section )
		this.dom.table_container_inner = $('<div class="fixed-table-container-inner"/>').appendTo( this.dom.table_container )
		this.dom.table = $('<table class="items hashover hashover-column"/>').appendTo( this.dom.table_container_inner )
		function gen_thead(arr){
			var thead = $('<thead/>')
				,tr = $('<tr/>').appendTo(thead)
			for(var i in arr){
				if( typeof arr[i] == 'object' ){
					$('<td class="stat-' + arr[i][1] + '"/>').html('<div class="th-inner">'+arr[i][0]+'</div>').appendTo(tr)
				}else{
					$('<th/>').html('<div class="th-inner">'+arr[i]+'</div>').appendTo(tr)
				}
			}
			return thead
		}
		gen_thead( self.columns ).appendTo( this.dom.table )
		this.dom.tbody = $('<tbody/>').appendTo( this.dom.table )

	// 获取所有装备数据
		_db.items.find({}).sort({'type': 1, 'rarity': 1, 'id': 1}).exec(function(err, docs){
			if( !err ){
				for(var i in docs){
					_g.data.items[docs[i]['id']] = docs[i]
					self.items.push( docs[i]['id'] )
				}
				if( !err && docs && docs.length ){
					self.append_item_all()
				}else{
					$('<p/>').html('暂无数据...').appendTo( self.dom.table_container_inner )
				}
			}
		})

	this.is_init = true
}

// @koala-prepend "js-app/!.js"
// @koala-prepend "js-app/main.js"

// @koala-prepend "js-app/items/!.js"
// @koala-prepend "js-app/items/ship.js"
// @koala-prepend "js-app/items/equipment.js"

// @koala-prepend "js-app/page/home.js"
// @koala-prepend "js-app/page/init.js"
// @koala-prepend "js-app/page/ships.js"
// @koala-prepend "js-app/page/items.js"
// @koala-prepend "js-app/page/entities.js"
// @koala-prepend "js-app/page/update.js"
// @koala-prepend "js-app/page/gamedata.js"

// @koala-prepend "js-app/form/_.js"

// @koala-prepend "js-app/components/selector-equipment.js"
// @koala-prepend "js-app/components/selector-ship.js"

// @koala-prepend "js-app/elements/shiplist.js"
// @koala-prepend "js-app/elements/itemlist.js"
