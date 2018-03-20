/**
 * use：
 * index.js -apiStorage
 * 
 */
const parent_folder_tpl = '<div style="padding-left: {{distance}}px;" data-site="{{site}}" class="parent-folder folder-item"><div class="leaf-item folder-box"><div class="folder-icon"><i class="fa fa-folder-o fz-28 color-green" aria-hidden="true"></i></div><div class="folder-info pd-t-10 pd-b-10 text-ellipsis"><p class="fz-14 text-ellipsis">{{name}}</p><p class="fz-12 text-ellipsis">20 api</p></div></div><div class="folder-operate"><div></div><div></div></div></div>';

const folder_tpl ='<div style="padding-left: {{distance}}px;" data-site="{{site}}" class="child-folder folder-item"><div class="leaf-item folder-box"><div class="folder-icon"><i class="fa fa-folder-o fz-16 color-green" aria-hidden="true"></i></div><div class="folder-info pd-t-10 pd-b-10 text-ellipsis"><p class="text-ellipsis">{{name}}</p></div></div><div class="folder-operate"></div></div>';

const api_tpl = '<div class="api-items" data-site="{{site}}"  style="padding-left: {{distance}}px;"><div class="folder-box api-item" id="{{site}}"><span class="font-bold api-type color-orange {{#isGet}}color-success{{/isGet}}">{{request.method}}</span><span class="api-name text-ellipsis">{{name}}</span></div><div class="folder-operate"></div></div>';


const Mustache = require('mustache');

const ipc = require('electron').ipcRenderer

var jsonfile = require('jsonfile')


const $folderContain = $('#folder-contain'), //左侧菜单
      $folderList = $('.folder-list', $folderContain),
      $parentFolder = $('.parent-folder', $folderList);

const $header = $('#header');

const $createBox = $('#create-box'),
	  $createName = $('#create-name'),
	  $projectName = $('#project-name'),
	  $createDesc = $('#create-desc'),
	  $createWarning = $('#create-warning');


$header.on('click', '.add-folder', function() {
	$projectName.text('项目名称');
	$createBox.data('type','project');
	$createBox.show();

}).on('click', '.download-files', function() {
	
	ipc.send('save-dialog')

	ipc.on('saved-file', function (event, path) {
	  	//if (!path) path = '无路径'
	  	const obj = JSON.parse(JSON.stringify(apiStorage.readAll()));
		jsonfile.writeFile(path, obj, {spaces: 2, EOL: '\r\n'}, function (err) {
		  //console.error(err)
		  if(err) {
		  	console.error(err);
		  } else {
		  	consoleAlert.showAlert('导出成功');
		  }
		})
	  	console.log(`选择的路径: ${path}`);
	})
	//writeFile();
});

let hideCreateBox = function() {
	$createName.val('');
	$createDesc.val('');
	$createWarning.text('');
	$createBox.hide();
}

$createBox.on('click', '.btn-confirm', function() {
	//确定
	const name = $createName.val(),
		  description = $createDesc.val(),
		  type = $createBox.data('type');

	if(!name) {
		let tipName = '请输入项目名称';
		if(type == 'folder') {
			tipName = '请输入文件夹名称';
		}

		$createWarning.text('请输入项目名称');
		return false;
	}

	if(type == 'folder') {
		const site = $folderContain.attr('site');
		//添加文件夹
		apiStorage.addFolder({
			name: name,
			description: description,
			site: site
		});
	} else {
		//添加项目
		//本地存储项目目录
		apiStorage.addProject({
			name: name,
			description: description
		});
	}

	hideCreateBox();
}).on('click', '.btn-cancle', function() {
	//取消
	hideCreateBox();
});



/**
 * 滚动条优化
 */
// $folderList.niceScroll({ cursorwidth: "5px", cursorcolor: "#ccc" });

/**
 * [初始化左侧菜单事件]
 * 添加子文件夹
 * 展开收缩文件夹
 */
const initLeftEvent = () => {
    $folderList.on('click', '.leaf-item', function() {
        const $this = $(this);
        //缓存site
        $folderContain.attr('site', $this.parent().data('site'));
        $('.leaf-item', $folderList).removeClass('on');
        $this.addClass('on');

        $this.parent().next().toggle();
    }).on('click', '.api-item', function() {
    	const $this = $(this),
    		site = $this.parent().data('site'),
    		name = $this.find('.api-name').text();

    	const resData = apiStorage.readItem(site)
    	// console.log(resData);
    	apiStorage.saveTab(name,site);

    	renderRightArea(resData,'menu');

    	$('.api-item').removeClass('on');
        $('#'+site).addClass('on');

    });
};
initLeftEvent();




//渲染左侧菜单树
const renderLeftMenu = (renderData) => {
    //获取数组位置
	var getArrSite = function (type,arrSite, i) {
		let splitStr = '-';
		if(type == 'api') {
			splitStr = '_';
		}
        return (arrSite === undefined) ? (i + '') : (arrSite + splitStr + i);
    };

	var renderView = function(dataArr,left,arrSite) {
		left = left ? left : 0;

		var str = '';
		left += 13;	//缩进的距离 单位为px

		dataArr.forEach(function(el, index) {
			var sumStr = '',
				spanStr = '';

			var itemStr = '';
			el.distance = left;	
			
			let itemType = 'folder';
			if(el.request) {
				itemType = 'api';
			}
			el.site = getArrSite(itemType, arrSite, index);

			if(el.item) {
				sumStr += '<ul >'+ renderView(el.item, left, el.site) +'</ul>';
			}

			if( el.item) {
				if(el.info ) {
					el.info.distance = left;
					el.info.site = getArrSite(itemType, arrSite, index);
					itemStr = Mustache.render(parent_folder_tpl, el.info);
				} else {
					itemStr = Mustache.render(folder_tpl, el);
				}
			} else  {
				el.isGet = el.request.method == 'GET' ? true : false;
				itemStr = Mustache.render(api_tpl, el);
			}

			str += '<li>' + itemStr + sumStr + '</li>';

		});
		return str;
	};

	const menuDomStr = renderView(renderData);

	$('#folder-list ul').html(menuDomStr);

	$('.folder-content').niceScroll({ cursorwidth: "5px", cursorcolor: "#ccc" });
}

window.renderLeftMenu = renderLeftMenu;

renderLeftMenu(apiStorage.readAll());



//右键菜单
const $contentMenu = $('#content-menu');

$('#folder-list').on('click','.folder-operate',function(e) {
	const $this = $(this);

	//右键菜单上缓存site信息
	const _site = $this.parent().data('site') + '';
	const hasExit = _site.indexOf('_') > -1 ? true: false;

	$contentMenu.data('site', _site);


	if($this.attr('flag') == 'true') {
		$this.attr('flag',false);
		$contentMenu.hide();
	} else {
		if(_site.length == 1) {
			$('.parent-folder-item', $contentMenu).show();
		} else {
			$('.parent-folder-item', $contentMenu).hide();
		}

		if(hasExit) {
			$('.folder-item', $contentMenu).hide();
		} else {
			$('.folder-item', $contentMenu).show();

		}
		$contentMenu.css('top',e.clientY- 184).show();
		$('.folder-operate').attr('flag',false);
		$this.attr('flag',true);
	}
});

function hideContentMenu() {
	$('.folder-operate').attr('flag',false);
	$contentMenu.hide();
}

//点击右侧菜单的按钮
$contentMenu.on('click', '.menu-item', function() {
		const $this = $(this),
			_role =  $this.data('role');
			// _site = $this.parent().parent().data('site');
			
		console.log(_role);

		if(_role == 'add') {
			$projectName.text('文件夹名称');
			$createBox.data('type','folder');
			//缓存到主菜单上
			// $folderContain.attr('site', _site);

			$createBox.show();

		} else if(_role == 'delete') {
			// $folderContain.attr('site');
			const _site = $contentMenu.data('site');

			console.log(_site);
			apiStorage.removeItem(_site);
		}

});

$(document).on('click', function(e) {
	var target = e.target,
		isNeedClose = false;

	if(!$('.folder-operate').is(target) && $('.folder-operate').has(target).length === 0) {
		isNeedClose = true;
	}

	if( isNeedClose) {
		hideContentMenu();
	}

})