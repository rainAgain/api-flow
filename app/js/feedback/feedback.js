const nodemailer = require('nodemailer');

var ipcRenderer = require('electron').ipcRenderer;

const transport = nodemailer.createTransport({
	host: 'smtp.qq.com',
	port: 465,
	secure: true, // use SSL
	// ignoreTLS: true,
	auth: {
		user: '2582253358@qq.com',
		pass: 'ydhmjwlefrmqdhgg'
	}
});



const $text = document.getElementById('input-text');

document.getElementById('close').onclick = function() {
	// BrowserWindow.getFocusedWindow().close();
	ipcRenderer.send('window-close','close');
}

var isSendEnd = true;

document.getElementById('send').onclick = function() {
	// $text.value = "43554"
	// alert($text.value)
	if(isSendEnd) {
		isSendEnd = false;
		const value = $text.value;
		if(!value) {
			return false;
		}
		
		transport.sendMail({
			from: "2582253358@qq.com",
			to: "943123380@qq.com,279421493@qq.com",
			subject: "【apiFlow】 建议反馈",
			generateTextFromHTML: true,
			html: value
		}, function(error, response) {
			document.getElementById('send').innerHTML = '发送成功';
			isSendEnd = true;
			setTimeout(function() {
				document.getElementById('send').innerHTML = '发送';
				$text.value = '';
				ipcRenderer.send('window-close','close');
				

			}, 2000);
			if (error) {
				console.log(error);
			} else {

				//console.log("Message sent: " + response.message);
			}
			transport.close();
		});
	}
	
}