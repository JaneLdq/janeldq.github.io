const canvas = document.getElementById('bg-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');

class Circle {
    constructor(x, y, r, c) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.c = c;

        this.dx = Math.floor(Math.random() * 4) + 1;
        this.dx *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;
        this.dy = Math.floor(Math.random() * 4) + 1;
        this.dy *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;

        this.draw = function () {
            ctx.beginPath();
            ctx.fillStyle = this.c;
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        };

        this.animate = function () {
            this.x += this.dx;
            this.y += this.dy;

            if (this.x + this.r > canvas.width || this.x - this.r < 0) {
                this.dx = -this.dx;
            }

            if (this.y + this.r > canvas.height || this.y - this.r < 0) {
                this.dy = -this.dy;
            }

            this.draw();
        };
    }
}

const balls = [];
for (let i = 0; i < 20; i++) {
    let r = Math.floor(Math.random() * 30) + 15;
    let x = Math.random() * (canvas.width - r * 2) + r;
    let y = Math.random() * (canvas.height - r * 2) + r;
    let c = 'rgba(233, 233, 233, 0.5)';
    balls.push(new Circle(x, y, r, c));
}
/* BONUS FEATURE */
canvas.addEventListener('click', function (e) {
    let r = Math.floor(Math.random() * 30) + 15;
    balls.push(new Circle(e.clientX, e.clientY, r, 'rgba(233, 233, 233, 0.8)'));
});

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let ball of balls) {
        ball.animate();
    }
}
requestAnimationFrame(update);
setInterval(update, 25);