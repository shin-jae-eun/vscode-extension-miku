// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('MY PETS LOADED');

	const provider = new DogViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('dogView', provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('my-pets.throwBall', () => {
			provider.postMessage({ type: 'throwBall' });
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('my-pets.clear', () => {
			provider.postMessage({ type: 'clear' });
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }

class DogViewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly extensionUri: vscode.Uri) { }

	private view?: vscode.WebviewView;

	resolveWebviewView(webviewView: vscode.WebviewView) {
		this.view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		webviewView.webview.html = this.getHtml(webviewView.webview);
	}

	public postMessage(message: any) {
		this.view?.webview.postMessage(message);
	}

	private getHtml(webview: vscode.Webview): string {
		const gifUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'test.gif')
		);

		return `<!DOCTYPE html>
<html>
<head>
<style>
body { margin:0; overflow:hidden; background:transparent; }
#ground { position:absolute; bottom:0; width:100%; height:4px; background:linear-gradient(90deg,#2a9d8f,#1d7f73); }
#dog { position:absolute; bottom:4px; left:0; height:64px; transition:left 0.1s linear; cursor:pointer; }
.ball { position:absolute; top:0; font-size:24px; }
.heart { position:absolute; font-size:20px; animation: floatUp 1s ease-out forwards; }
@keyframes floatUp {
  0% { opacity:1; transform:translateY(0); }
  100% { opacity:0; transform:translateY(-40px); }
}
#controls { position:absolute; top:5px; right:5px; }
button { font-size:12px; }
</style>
</head>
<body>
<img id="dog" src="${gifUri}" />
<div id="ground"></div>
<script>
const dog = document.getElementById('dog');
let position = 0;
let direction = 1;

function move() {
  position += direction * 4;
  if (position > window.innerWidth - 70) direction = -1;
  if (position < 0) direction = 1;
  dog.style.left = position + 'px';
}
setInterval(move, 80);

dog.addEventListener('click', () => {
  const heart = document.createElement('div');
  heart.className = 'heart';
  heart.textContent = '❤️';
  heart.style.left = (position + 20) + 'px';
  heart.style.bottom = '70px';
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 1000);
});

function spawnBall() {
  const ball = document.createElement('div');
  ball.className = 'ball';
  ball.textContent = '🎾';
  ball.style.left = Math.random() * (window.innerWidth - 30) + 'px';
  document.body.appendChild(ball);

  let topPos = 0;
  const fall = setInterval(() => {
    topPos += 5;
    ball.style.top = topPos + 'px';

    const ballX = ball.offsetLeft;
    const dogX = position;
    if (topPos > window.innerHeight - 100 && Math.abs(ballX - dogX) < 40) {
      clearInterval(fall);
      ball.remove();
    }

    if (topPos > window.innerHeight) {
      clearInterval(fall);
      ball.remove();
    }
  }, 30);
}

window.addEventListener('message', event => {
  const msg = event.data;
  if (msg.type === 'throwBall') {
    spawnBall();
  }
  if (msg.type === 'clear') {
    document.querySelectorAll('.ball').forEach(b => b.remove());
    document.querySelectorAll('.heart').forEach(h => h.remove());
  }
});
</script>
</body>
</html>`;
	}
}
