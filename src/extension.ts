import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const provider = new PetViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('dogView', provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('my-pets.addPet', () => {
            provider.postMessage({ type: 'addPet' });
        })
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

export function deactivate() {}

class PetViewProvider implements vscode.WebviewViewProvider {

    private view?: vscode.WebviewView;

    constructor(private readonly extensionUri: vscode.Uri) {}

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

        return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
body {
    margin: 0;
    overflow: hidden;
    background: transparent;
}

#ground {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg,#2a9d8f,#1d7f73);
}

.pet {
    position: absolute;
    bottom: 4px;
    height: 64px;
    cursor: pointer;
}

.ball {
    position: absolute;
    top: 0;
    font-size: 24px;
}

.heart {
    position: absolute;
    font-size: 20px;
    animation: floatUp 1s ease-out forwards;
}

@keyframes floatUp {
    0%   { opacity:1; transform:translateY(0); }
    100% { opacity:0; transform:translateY(-40px); }
}
</style>
</head>
<body>

<div id="pet-layer"></div>
<div id="ground"></div>

<script>
const petLayer = document.getElementById('pet-layer');
const pets = [];

function createPet(x) {
    const img = document.createElement('img');
    img.src = "${gifUri}";
    img.className = 'pet';
    img.style.left = x + 'px';

    const pet = {
        el: img,
        x: x,
        dir: Math.random() > 0.5 ? 1 : -1
    };

    img.addEventListener('click', () => {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = '❤️';
        heart.style.left = (pet.x + 20) + 'px';
        heart.style.bottom = '70px';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);
    });

    petLayer.appendChild(img);
    pets.push(pet);
}

function movePets() {
    pets.forEach(pet => {
        pet.x += pet.dir * 3;

        if (pet.x > window.innerWidth - 70) pet.dir = -1;
        if (pet.x < 0) pet.dir = 1;

        pet.el.style.left = pet.x + 'px';
    });
}

setInterval(movePets, 60);

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

        pets.forEach(pet => {
            if (topPos > window.innerHeight - 100 &&
                Math.abs(ballX - pet.x) < 40) {

                clearInterval(fall);
                ball.remove();
            }
        });

        if (topPos > window.innerHeight) {
            clearInterval(fall);
            ball.remove();
        }

    }, 30);
}

function clearAll() {
    document.querySelectorAll('.ball').forEach(b => b.remove());
    document.querySelectorAll('.heart').forEach(h => h.remove());
    pets.splice(0, pets.length);
    petLayer.innerHTML = '';
}

createPet(0);

window.addEventListener('message', event => {
    const msg = event.data;

    switch (msg.type) {
        case 'addPet':
            createPet(Math.random() * (window.innerWidth - 70));
            break;

        case 'throwBall':
            spawnBall();
            break;

        case 'clear':
            clearAll();
            createPet(0);
            break;
    }
});
</script>

</body>
</html>
`;
    }
}
