'use client';

import { useEffect, useRef } from 'react';

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Đảm bảo canvas và ctx không null trong phạm vi của các hàm
    const safeCanvas = canvas;
    const safeCtx = ctx;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * safeCanvas.width;
        this.y = Math.random() * safeCanvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        // Màu xanh lá và xanh rêu với độ đậm cao hơn
        const colors = [
          // Xanh lá
          `rgba(34, 197, 94, ${Math.random() * 0.3 + 0.3})`, // Tăng độ đậm
          `rgba(16, 185, 129, ${Math.random() * 0.3 + 0.3})`,
          `rgba(101, 163, 13, ${Math.random() * 0.3 + 0.3})`,
          // Xanh rêu
          `rgba(107, 122, 77, ${Math.random() * 0.3 + 0.3})`,
          `rgba(86, 98, 62, ${Math.random() * 0.3 + 0.3})`,
          `rgba(77, 124, 15, ${Math.random() * 0.3 + 0.3})`,
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > safeCanvas.width) this.x = 0;
        else if (this.x < 0) this.x = safeCanvas.width;
        if (this.y > safeCanvas.height) this.y = 0;
        else if (this.y < 0) this.y = safeCanvas.height;
      }

      draw() {
        safeCtx.fillStyle = this.color;
        safeCtx.beginPath();
        safeCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        safeCtx.fill();
      }
    }

    // Create particles
    const particlesArray: Particle[] = [];
    const numberOfParticles = Math.min(100, Math.floor((safeCanvas.width * safeCanvas.height) / 10000));

    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }

    // Connect particles with lines
    function connect() {
      const maxDistance = 150;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = 1 - distance / maxDistance;
            safeCtx.strokeStyle = `rgba(34, 197, 94, ${opacity * 0.4})`; // Tăng độ đậm của đường kẻ
            safeCtx.lineWidth = 1.05; // Tăng độ dày của đường kẻ một chút
            safeCtx.beginPath();
            safeCtx.moveTo(particlesArray[a].x, particlesArray[a].y);
            safeCtx.lineTo(particlesArray[b].x, particlesArray[b].y);
            safeCtx.stroke();
          }
        }
      }
    }

    // Animation loop
    function animate() {
      // Xóa canvas với độ trong suốt nhẹ để tạo hiệu ứng vệt mờ
      safeCtx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Gần như xóa hoàn toàn, chỉ để lại vệt mờ nhẹ
      safeCtx.fillRect(0, 0, safeCanvas.width, safeCanvas.height);

      // Update and draw particles
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }

      connect();
      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-primary-50 via-lime-50 to-secondary-50"
    />
  );
}
