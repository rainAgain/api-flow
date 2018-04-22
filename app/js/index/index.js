/**
 * Author: jjj
 * 2017-12-15
 * index.html
 */

/*-------- javascript文件 -----*/
//jQuery

require('../lib/jquery.nicescroll.min.js');
//CodeMirror
const CodeMirror = require('../lib/codemirror/codemirror.js');
require('../lib/codemirror/fold/foldcode.js');
require('../lib/codemirror/fold/foldgutter.js');
require('../lib/codemirror/fold/brace-fold.js');
require('../lib/codemirror/fold/indent-fold.js');
require('../lib/codemirror/fold/comment-fold.js');
require('../lib/codemirror/javascript.js');
require('../lib/codemirror/simplescrollbars.js');

require('../lib/codemirror/addon/lint/jshint.min.js');

require('../lib/codemirror/addon/lint/lint.js');
require('../lib/codemirror/addon/lint/javascript-lint.js');
require('../lib/codemirror/addon/lint/json-lint.js');


//mustache
const Mustache = require('mustache');

//加载工具
require('./util.js');

//左侧菜单功能
require('./leftmenu.js');

/*-------- node模块 -----*/
const request = require('request');
const clipboard = require('electron').clipboard;

var fs = require('fs');


/*-------- 变量 -----*/
const HEADER_TPL = '<li class="clearfix full-width key-list-li"><div class="l key-item"><input class="param-input param-key" placeholder="New key" type="text"></div><div class="l key-item"><input class="param-input param-value" placeholder="value" type="text"></div><div class="l key-item"><input class="param-input param-description" placeholder="Description" type="text"></div><div class="key-item-close">×</div></li>';

const HEADER_LIST_TPL = '{{#list}}<li class="clearfix full-width key-list-li"><div class="l key-item"><input class="param-input param-key" placeholder="New key" value="{{key}}" type="text"></div><div class="l key-item"><input class="param-input param-value" placeholder="value" value="{{value}}" type="text"></div><div class="l key-item"><input class="param-input param-description" placeholder="Description" type="text"></div><div class="key-item-close">×</div></li>{{/list}}'

const TAB_TPL = '{{#list}}<li class="l tab text-ellipsis pd-l-10 mg-l-10 pointer {{#active}}active{{/active}}" site={{site}} psite={{psite}} ><span>{{name}}</span><div class="tab-close">×</div></li>{{/list}}'

const TAB_MORE_TPL = '{{#list}}<li class="tab more-tab-item text-ellipsis" site={{site}} psite={{psite}}>{{name}}</li>{{/list}}';

const $operateContain = $('#operate-contain'), //右侧主内容
    //请求类型Type
    $handleContain = $('#handle-contain', $operateContain),
    $selectList = $('#select-list', $handleContain),
    $selectedText = $('#selected-text', $handleContain),
    $selectedIcon = $('#selected-icon', $handleContain),
    $selectItem = $('.select-item', $selectList),

    //请求的url
    $requestInput = $('.request-input', $handleContain),
    //接口tab
    $tabs = $('.tabs', $operateContain),
    $tabUlBox = $('.tabs-ul-box', $tabs),
    $tabsUl = $('#tabs-ul'),
    $apiInfoInput = $('.api-info-input', $operateContain),
    $apiInfoDesc = $('.api-info-desc', $operateContain),

    //save按钮

    //请求头tab
    $paramsContain = $('#params-contain'),
    $paramTypeBody = $('.param-type-body', $paramsContain),
    // $keyListUl = $('.key-list-ul', $paramsContain),

    //请求头tab具体内容
    //auth
    $paramsAuth = $('#params-authorization'),
    $authSelectList = $('.auth-select-list', $paramsAuth),
    $authSelectResult = $('.auth-select-result', $paramsAuth),
    //headers
    $paramsHeaders = $('#params-headers'),
    //body
    $paramsBody = $('#params-body'),

    //请求结果tab


    //请求结果功能栏
    $bodyContain = $('#body-contain'),
    $resHeaderUl = $('.res-header-ul',$bodyContain),
    $bodyTypeHeader = $('.body-type-header',$bodyContain),

    $functionBtns = $('.function-btns', $bodyContain),

    $resStatus = $('.res-status', $functionBtns),
    $resTime = $('.res-time', $functionBtns);

let editor, bodyEditor;

const getPostType = function() {
    return $('input:radio[name="param-body-type"]:checked').val();
};


//获取请求的heaers参数
const getRequestHeaders = (type) => {
    let headers;

    if(type == 'array') {
        headers = [];
    } else {
        headers = {};
    }

    $('.params-headers .key-list-ul li').each((index,item) => {

        const $this = $(item),
            key = $.trim($('.param-key', $this).val()),
            value = $.trim($('.param-value', $this).val());

        if(key) {
            if(type == 'array') {
                headers.push({
                    key: key,
                    value: value
                });
            } else {
                headers[key] = value;
            }
            
        }
        
    });

    return headers;
};

//获取请求是body为formData的数据
const getRequestBodyFormData = (type) => {
    let formData;

    if(type == 'array') {
        formData = [];
    } else {
        formData = {};
    }

    $('.body-form-data .key-list-ul li').each((index,item) => {

        const $this = $(item),
            key = $.trim($('.param-key', $this).val()),
            value = $.trim($('.param-value', $this).val());

        if(key) {
            if(type == 'array') {
                formData.push({
                    key: key,
                    value: value
                });
            } else {
                formData[key] = value;
            }
        }
    });
    return formData;
};

//获取body为xformUrlencode的数据
const getRequestXFormUrlencoded = (type) => {
    let formUrlencodedData;

    if(type == 'array') {
        formUrlencodedData = [];
    } else {
        formUrlencodedData = {};
    }

    $('.body-x-www-form-urlencoded .key-list-ul li').each((index,item) => {

        const $this = $(item),
            key = $.trim($('.param-key', $this).val()),
            value = $.trim($('.param-value', $this).val());

        if(key) {
            if(type == 'array') {
                formUrlencodedData.push({
                    key: key,
                    value: value
                });
            } else {
                formUrlencodedData[key] = value;
            }
        }
    });

    return formUrlencodedData;
};

//获取返回的headers
const renderResponseHeaders = (response) => {
    //headers
    let headerKeys = Object.keys(response.headers),
        headerStr = '';

    headerKeys.forEach((item,index) => {
        let mark = '';
        if(item == 'access-control-allow-origin') {
            mark = 'color-orange';
        }
        headerStr += '<li class="'+mark+'">' + item +' → ' + response.headers[item] + '</li>';
    });

    $resHeaderUl.html(headerStr);
    $bodyTypeHeader.html('Headers('+ headerKeys.length +')')
};

const renderRequestHeaders = (data) => {
    // console.log(data);
    if(!data.length) {
        data.push({
            key:'',
            value: ''
        })
    }
    if(data[data.length-1].key ||  data[data.length-1].value) {
        data.push({
            key:'',
            value: ''
        })
    }
    $('.params-headers .key-list-ul').html(Mustache.render(HEADER_LIST_TPL, {list: data}));
    
};

const renderRequestFormData = (data) => {
    // console.log(data);
    if(!data.length) {
        data.push({
            key:'',
            value: ''
        })
    }
    if(data[data.length-1].key ||  data[data.length-1].value) {
        data.push({
            key:'',
            value: ''
        })
    }
    $('.body-form-data .key-list-ul').html(Mustache.render(HEADER_LIST_TPL, {list: data}));
    
};

const renderRequestXUrlEncode = (data) => {
    // console.log(data);
    if(!data.length) {
        data.push({
            key:'',
            value: ''
        })
    }
    if(data[data.length-1].key ||  data[data.length-1].value) {
        data.push({
            key:'',
            value: ''
        })
    }
    $('.body-x-www-form-urlencoded .key-list-ul').html(Mustache.render(HEADER_LIST_TPL, {list: data}));
    
};

//导出文件
const writeFile = (path,name,body) => {
    fs.writeFile(path + name +".apiflow_collection.json", body, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
};

window.writeFile = writeFile;



//切换body的tab类型
const changeBodyList = (method) => {
    //如果请求类型为GET，那么没有body参数
    method == 'GET' ? $paramTypeBody.removeClass('enable') : $paramTypeBody.addClass('enable');

    if(method == 'POST') {
        $('.param-type-body').trigger('click');
    };

    if(method == "GET") {
        $('.param-type-headers').trigger('click')
    }
};

//渲染tab栏
const renderTab = () => {
    // const boxW =  $operateContain.width();

    const tabData = apiStorage.readTabAll();
    // console.log(tabData);
    if(bodyEditor) {

        bodyEditor.setValue('{}');
    }
    const sumWidth = tabData.length * 160;
    //console.log(boxW);
   /* $('.tabs').css('width',boxW - 35 +'px');
    $('.create-tab').css({
        "position":'absolute',
        "top":0,
        "right": 0
    })*/
    //.css('width',sumWidth+'px')
    
    $tabsUl.html(Mustache.render(TAB_TPL,{list: tabData})).css('width',sumWidth+'px');
    
    $('.tab-more-list').html(Mustache.render(TAB_MORE_TPL, {list: tabData}));
    
    $('.tab-more-list').niceScroll({ cursorwidth: "5px", cursorcolor: "#ccc" });

    $tabUlBox.css('max-width', parseInt($operateContain.width()) - 48 );
};

$tabUlBox.niceScroll({ cursorwidth: "0", autohidemode:'hidden', cursorcolor: "#ddd" });

window.onresize = function() {
    $tabUlBox.css('max-width', parseInt($operateContain.width()) - 48 );
}

let tabTImer;
const adjustTab = function(type) {
    if(tabTImer) clearTimeout(tabTImer);
    
    const _$tab = $('.tab.active', $tabs);
    // $tabsUl.css('left', - (_$tab.index()+1)*160 + (parseInt($operateContain.width()) - 50) +'px')
    // console.log(_$tab.index());
    const leftDistance = 160 * (_$tab.index()+1);//总移动的距离
    // console.log(leftDistance);
    const tabBoxWidth = $tabUlBox.width();//可视区域的宽度

    let moveDistabce = leftDistance - tabBoxWidth;//最后移动的距离
    

    if(moveDistabce < 0) {
        moveDistabce = 0;
    }
    // $tabsUl.animate({'left': moveDistabce+'px'});
    //改为nicescroll的移动

    if(type == 'add-api') {
        
        
        //不想加定时器，不知道为什么，在执行add-api的方法后，这个滚动条不执行
        //所以这里单独给add-api的执行时添加定时器
        tabTImer = setTimeout(function() {
            $tabUlBox.getNiceScroll(0).doScrollLeft(moveDistabce, 200);
        },250);
    } else {
        $tabUlBox.getNiceScroll(0).doScrollLeft(moveDistabce, 200);        
    }
    
    

};

//切换 tab 渲染右侧区域
//type --- menu 表示 点击左侧菜单，需要检查本地缓存
//     --- tab 或者为空 表示 点击顶部tab标签
const renderRightArea = (info,type) => {
    if(type == 'menu') {
        renderTab();
        adjustTab();
    }
    
    if(typeof info == 'object') {
        const name = info.name,
            description = info.request.description,
            header = info.request.header,
            method = info.request.method,
            url = info.request.url,
            body = info.request.body;
        const site = info.site;

        // $('.tab.active', $tabs).attr('site', site).html(name);
        

        changeBodyList(method)

        if(method == 'POST') {
            if(body.mode == 'raw') {
                $('#application-json').trigger('click');
                bodyEditor.setValue(body.raw);
            } else if(body.mode == 'formdata') {
                $('#form-data').trigger('click');
                renderRequestFormData(body.formdata);
                
            } else if(body.mode == 'x-www-form-urlencoded') {
                $('#x-www-form-urlencoded').trigger('click');
                renderRequestXUrlEncode(body.urlencoded);
            }
        }

        $apiInfoInput.val(name);
        $apiInfoDesc.val(description);
        $selectedText.text(method).data('type', method);
        $requestInput.val(url);

        renderRequestHeaders(header);

        $('.body-type-body').trigger('click');
        editor.markClean();
        editor.setValue('');
        $resStatus.removeClass('color-error').text('');
        $resTime.removeClass('color-error').text('');
        
        $('.res-cookies>div').html('no-cookies');
        $bodyTypeHeader.html('Headers')
        $('.res-header-ul').html('no-headers');

    }
}


window.renderRightArea = renderRightArea;

/**
 * 初始化方法
 * 右侧主区域
 * 1、代码展示，折叠样式
 * 2、滚动条
 * 3、请求类型交互
 */
const initRightEvent = () => {
/**
 * tab 切换
 */
    $tabs.on('click', '.tab', function() {
        var $this = $(this),
            site = $this.attr('site'),
            index = $this.index();

        //var site = this.site;
        // console.log("site");
        // console.log(site);
        $('[site="'+site+'"]').addClass('active').siblings().removeClass('active');

        // $this.addClass('active').siblings().removeClass('active');
        adjustTab();
        const resData = apiStorage.readItem(site);

        renderRightArea(resData);

        $('.api-item').removeClass('on');
        $('#'+site).addClass('on');

        if($this.hasClass('more-tab-item')) {
            $('.tab-more-list').hide();
        }

     }).on('click', '.tab-more', function() {
        $('.tab-more-list').toggle();
        
     }).on('click', '.add-api', function() {
        
        apiStorage.addTab();

        renderTab();

        const resData = {
            name: '',
            request: {
                description: '',
                header:[],
                method: 'GET',
                url: '',
                body:{

                }
            }
        };
        $tabsUl.find('.tab-close').removeClass('remove');
        renderRightArea(resData);
        adjustTab('add-api');
        
     }).on('click', '.tab-close', function() {
        const $this = $(this);

        
        const site = $this.parent().attr('site');
        
        const prevSite = $this.parent().prev().attr('site');

        apiStorage.removeTab(site);

        renderRightArea(prevSite,'menu');
        
        console.log($tabsUl.find('.tab'));

        if($tabsUl.find('.tab').length == 1) {
            $tabsUl.find('.tab-close').addClass('remove');
        }
        

     });



/**
 * tab和tab名
 * 名称和描述框失去焦点进行保存
 */
    $operateContain.on('change', '.api-info-input', function() {
        var $this = $(this),
            _val = $.trim($this.val()),
            tabName = 'New Tab';

        if (_val) tabName = _val;

        $('.tab.active', $tabs).html(tabName);
    });

/**
 * 请求参数的信息
 */
    
    //firstFlag 标记 表示是否是第一次加载
    var firstFlag = true;
    //请求类型切换的tab--- Authorization headers body
    $paramsContain.on('click', '.param-type.enable', function() {

        var $this = $(this),
            _type = $this.data('type');

        /*切换请求的tab*/
        $('.params-' + _type, $paramsContain).addClass('active')
            .siblings().removeClass('active');

        $this.addClass('active')
            .siblings().removeClass('active');

        /*第一次加载body的时候初始化*/
        if (firstFlag && _type == 'body') {

            firstFlag = false;

            /**
             * 初始化请求body的样式，带折叠
             */
            initParamsbody();
        }

    }).on('keyup', '.param-input', function() {
        /**
         * [headers]
         * 输入时，判断是否是最后一行，
         * 如果是则在下面自动添加一行新的数据
         * 如果不是，不做操作
         * @type {[type]}
         */
        var $this = $(this),
            _val = $.trim($this.val()),

            sum = $this.parent().parent().siblings().length + 1,
            currentLiIndex = $this.parent().parent().index();

        if (currentLiIndex == sum - 1 && _val) {
            // Mustache.parse(HEADER_TPL);
            //paramLiStr = Mustache.render(HEADER_TPL);

            $this.parent().parent().after(HEADER_TPL)
        }
    });

    //auth 用户切换
    $paramsAuth.on('click', '.auth-select-result', function() {
        $authSelectList.slideToggle();
    }).on('click', '.auth-select-item', function(e){
        e.stopPropagation();
        var _val = $(this).data('value'),
            _text = $(this).text();

        // console.log(_val);
        $authSelectResult.data('value', _val).text(_text);
        $authSelectList.slideToggle();
    });

    //headers,点击后面的x，进行移除
    $paramsHeaders.on('click', '.key-item-close', function() {
        var $this = $(this),
            $parent = $this.parent(),
            _index = $parent.index();
        
        if($parent.siblings().length) {
            $parent.remove();
        } else {
            !_index ? $('.param-input', $parent).val('') : $parent.remove();
        }
    });

    //请求的body
    $paramsBody.on('click', '.param-body-type', function() {
        var _type = getPostType();
        
        $('.body-' + _type, $paramsBody).show().siblings().hide();

    }).on('click', '.key-item-close', function() {
        var $this = $(this),
            $parent = $this.parent(),
            _index = $parent.index();
        
        if($parent.siblings().length) {
            $parent.remove();
        } else {
            !_index ? $('.param-input', $parent).val('') : $parent.remove();
        }
    });

    //多功能图标
    $bodyContain.on('click', '.btn-icons', function(e) {
        e.stopPropagation();
        const $this = $(this),
            _iconType = $this.data('type');

        if(_iconType == 'clear') {
            editor.markClean();
            editor.setValue('');
        } else if( _iconType == 'copy') {
            const word = editor.getValue();
            clipboard.writeText(word);
            

        } else if( _iconType == 'exchange') {

        }
    });

/**
 * [隐藏请求类型下拉选择]
 * @return {[type]} [description]
 */
    const hideSelect = () => {
        $selectList.toggle();
        $selectedIcon.toggleClass('color-green');
    };

/**
 * 接口相关操作
 * 选择请求类型
 * 请求
 * 保存
 * get
 * post
 */
    $handleContain.on('click', '.selected', function() {
        hideSelect();
    }).on('click', '.select-item', function() {
        //选择请求类型
        const _text = $(this).text();

        $selectedText.text(_text).data('type', _text);

        changeBodyList(_text);

        hideSelect();
    }).on('click', '.send-btn', function() {
        //发送请求
        sendRequest();
    }).on('click', '.save-btn', function() {
        //保存
        
        const name = $.trim($apiInfoInput.val());
        if (!name) {
            consoleAlert.showAlert('请先填写接口名称');
        } else {

            let folderSite = '',
                hasExit = false,
                apiSite = '';

            //如果当前激活的tab已经存在
            //则直接替换
            const tabSite = $('.tab.active', $tabs).attr('site');

            if(tabSite.indexOf('add') < 0) {
                folderSite = tabSite.split('_')[0];
                
                hasExit = true;
                apiSite = tabSite.split('_')[1];

            } else {
                const _site = $('#folder-contain').attr('site');
                if(!_site) {
                    consoleAlert.showAlert('请先选择文件夹');
                    return false;
                }
                folderSite = _site;
            }

            const description = $.trim($apiInfoDesc.val()),
                url = $.trim($requestInput.val()),
                method = $selectedText.data('type'),
                headers = getRequestHeaders('array');

            let body = {};

            if(method == 'POST') {
                const  _type = getPostType();
                if(_type == 'application-json') {
                    body = {
                        mode: 'raw',
                        raw: bodyEditor.getValue()
                    };
                    
                } else if( _type == 'form-data') {
                    body = {
                        mode: 'formdata',
                        ormdata: getRequestBodyFormData('array')
                    };
                } else if( _type == 'x-www-form-urlencoded') {
                    body = {
                        mode: 'urlencoded',
                        urlencoded: getRequestBodyFormData('array')
                    };
                }
            }
            //保存到数组中
            apiStorage.saveApi({
                hasExit: hasExit,   //是否已经存在
                apiSite: apiSite,   //如果存在则下标为多少
                name: name,
                description: description,
                url: url,
                method: method,
                header: headers,
                body: body,
                response: [],
                site: folderSite
            },function(newSite) {
                // console.log(newSite);
                if(!hasExit) {
                    $('.tab.active', $tabs).attr('site', newSite);
                }
                
            });

            apiStorage.removeTab(tabSite);

            $('#folder-contain').attr('site','');
            consoleAlert.showAlert('保存成功');


        }
    });

    $bodyContain.on('click', '.body-type', function() {
        const $this = $(this),
            type = $this.data('type'),
            index = $this.index();

        $this.addClass('active').siblings().removeClass('active');
        $('.res-item',  $bodyContain).eq(index).addClass('active').siblings().removeClass('active');
        
        if(type == 'body') {

        } else if (type == 'cookies') {

        } else if(type == 'header') {

        }

    });

    /**
     * 初始化请求结果的样式，带折叠
     */
    editor = CodeMirror.fromTextArea(document.getElementById('test'), {
        mode: "javascript",
        lineNumbers: true,
        matchBrackets: true,
        styleActiveLine: true, // 激活当前行样式
        lineWrapping: true,
        readOnly: true, // 是否只读，默认false
        extraKeys: { "Ctrl-Q": function(cm) { cm.foldCode(cm.getCursor()); } },
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        theme: 'neat',
        scrollbarStyle: "simple"
    });

    function initParamsbody() {
        bodyEditor = CodeMirror.fromTextArea(document.getElementById('paramsbody'), {
            mode: "application/json",
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true, // 激活当前行样式
            lineWrapping: true,
            readOnly: false, // 是否只读，默认false
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter","CodeMirror-lint-markers"],
            lint: true,
            theme: 'neat',
            scrollbarStyle: "simple"
        });

        bodyEditor.setValue('{}')
    }

    /**
     * 滚动条优化
     */
    $operateContain.niceScroll({ cursorwidth: "5px", cursorcolor: "#ccc" });


    renderTab();
    const site = $('.tab.active').attr('site');

    if(site) {
        $('.api-item').removeClass('on');
        $('#'+site).addClass('on');
        
        const resData = apiStorage.readItem(site)

        renderRightArea(resData,'menu');
    }
    
};

initRightEvent();



//发送请求
const sendRequest = () => {
    const url = $requestInput.val(),
        requestType = $selectedText.data('type');

    const headers = getRequestHeaders('object');

    // console.log(headers);

    /*let urlStr = url;

    if(headers.length && headers[0].key) {
        urlStr += '?';
        for(let i = 0,len = headers.length; i< len; i++) {
            const _key = headers[i].key;
            if(_key) {
                const _value = headers[i].value? headers[i].value: '';

                urlStr += Util.trim(_key) + '=' + Util.trim(_value) + '&'; 
            }
        }
        url = Util.clearLast(urlStr);
    }*/
    const opt = {
        url: url,
        headers: headers
    };

    if (requestType == "GET") {

        requestApi.get(opt);

    } else if (requestType == "POST") {

        requestApi.post(opt);
    }
};

const requestApi = {
    get: (opt) => {
        const url = opt.url,
            headers = opt.header;
        // get请求
        const timeBeforeSend = new Date().getTime();

        request(url,{
            headers: headers
        }, (error, response, body) => {
            // console.log(response.statusCode);
            console.log('-------------------response---------------------');
            
            const timeResponse = new Date().getTime(),
                timeSolt = timeResponse - timeBeforeSend;

            // console.log(response);

            $resTime.text(timeSolt +'ms');
            // console.log(error);

            if(response) {
                $('.body-type-body').trigger('click');

                if(('' + response.statusCode).substr(0,1) != 2) {
                    $resStatus.addClass('color-error');
                } else {
                     $resStatus.removeClass('color-error');
                }
                
                $resStatus.text(response.statusCode +' ' + response.statusMessage);
                

                if (!error) {
                    console.log('-------------------body---------------------');
                    // console.log(body);
                    
                    editor.markClean();
                    editor.setValue(body);
                }

                renderResponseHeaders(response); 
            }

            if(error) {
                editor.setValue(error.toString());
            }
            
        });
    },
    post: (opt) => {
        const url = opt.url,

            // params = opt.params,
            headers = opt.headers;
        // post请求
        const  _type = getPostType();

        let option = {
            url: url
        };

        if(Object.keys(headers).length) {
            option.headers = headers
        };
        
        // console.log(option);

        if (_type == 'application-json') {
            option.json = true;
            // console.log(typeof bodyEditor.getValue())
            option.body = (bodyEditor && bodyEditor.getValue()) ? JSON.parse(bodyEditor.getValue()): {};

        } else
        if (_type == 'form-data') {

            const formData = getRequestBodyFormData('object');
            
            // console.log(formData);

        } else 
        if (_type =='x-www-form-urlencoded') {

            const formUrlencodedData = getRequestXFormUrlencoded('object');
            option.form = formUrlencodedData;
        }
        
        const timeBeforeSend = new Date().getTime();



        request.post(option, function(error, response, body) {
            console.log('POST 请求');
            console.log('-------------------response---------------------');
            // console.log(response);
            
            const timeResponse = new Date().getTime(),
                timeSolt = timeResponse - timeBeforeSend;

            $resTime.text(timeSolt +'ms');

            if(response) {
                $('.body-type-body').trigger('click');

                $resStatus.text(response.statusCode +' ' + response.statusMessage);
                if(('' + response.statusCode).substr(0,1) != 2) {
                    $resStatus.addClass('color-error');
                } else {
                     $resStatus.removeClass('color-error');
                }
                //body
                if (!error) {
                    editor.markClean();
                    editor.setValue(JSON.stringify(body,null,4));
                }

                renderResponseHeaders(response);
            }

            if(error) {
                editor.setValue(error.toString());
            }
            
            
        }).on('error', function(err) {
            console.log(err)
        })
    }
};


/*
const $send = document.getElementById('send');
const $url = document.getElementById('url');
const $response = document.getElementById('response');
const {ipcRenderer} = require('electron');

$send.onclick = function() {
    request($url.value, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        $response.innerHTML = body;
      }
    });
};


const $autoupdate = document.getElementById('autoupdate');

$autoupdate.onclick = function() {
    
};

// Listen for messages

ipcRenderer.on('message', function(event, text) {
  var container = document.getElementById('messages');
  var message = document.createElement('div');
  message.innerHTML = text;
  container.appendChild(message);
})*/