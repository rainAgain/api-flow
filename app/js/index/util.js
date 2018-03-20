(function(win, $) {
	const Util = {};

	Util.guid = ()  => {
		function S4() {
	       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	    }
	    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	};

	Util.trim = (Str) => {
		if(typeof Str == 'string') { 
			return Str.replace(/(^\s*)|(\s*$)/g, ""); 
		}
	};

	//去掉字符串最后一位
	Util.clearLast = (Str) => {
		if(typeof Str == 'string') {
			return Str.substring(0,Str.length-1);
		}
	};


	//alert 提示框
    $alertBox = $('#alert-box'),
    $bgCover = $('.bg-cover', $alertBox),
    $alertContent = $('.layer-alert-content', $alertBox),
    $layers = $('.layers', $alertBox);


	const consoleAlert = {
	    showAlert(content) {
	        $alertContent.html(content);
	        $alertBox.show();
	    },
	    hideAlert() {
	        $alertContent.html('');
	        $alertBox.hide();
	    }
	};

	$alertBox.on('click', '.bg-cover', function() {
	    consoleAlert.hideAlert();
	});


	win.Util = Util;
	win.consoleAlert = consoleAlert;
})(window, jQuery);

