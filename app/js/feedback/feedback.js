const nodemailer = require('nodemailer');

var ipcR = require('electron').ipcRenderer;

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
	// alert(2);
	// BrowserWindow.getFocusedWindow().close();
	ipcR.send('window-close');
}

document.getElementById('send').onclick = function() {
	// $text.value = "43554"
	// alert($text.value)
	const value = $text.value;

	transport.sendMail({
		from: "2582253358@qq.com",
		to: "943123380@qq.com,279421493@qq.com",
		subject: "【apiFlow】 建议反馈",
		generateTextFromHTML: true,
		html: value
	}, function(error, response) {
		if (error) {
			console.log(error);
		} else {

			//console.log("Message sent: " + response.message);
		}
		transport.close();
	});
}