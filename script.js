// ==========================================================
// 0. WEBGL BACKGROUND NOISE (OVERDRIVE)
// ==========================================================
const canvas = document.getElementById("glcanvas");
if (canvas) {
    const gl = canvas.getContext("webgl");
    if (gl) {
        const vertexShaderSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float noise(in vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                st.x *= u_resolution.x / u_resolution.y;

                // Força de reação do mouse
                vec2 mousePos = u_mouse / u_resolution.xy;
                mousePos.x *= u_resolution.x / u_resolution.y;
                float dist = distance(st, mousePos);
                
                // Geração de ruído orgânico
                vec2 pos = vec2(st * 4.0);
                float n = noise(pos + u_time * 0.15 + noise(pos * 2.0 - u_time * 0.1));
                
                // Distorção magnética do mouse com suavizador
                n += smoothstep(0.4, 0.0, dist) * 0.4;

                // Chumbo / Pitch Black color math
                vec3 color = vec3(0.02) + vec3(0.08) * n;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        function compileShader(source, type) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        }

        const program = gl.createProgram();
        gl.attachShader(program, compileShader(vertexShaderSource, gl.VERTEX_SHADER));
        gl.attachShader(program, compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER));
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,  1.0, -1.0,  -1.0, 1.0,
            -1.0,  1.0,  1.0, -1.0,   1.0, 1.0
        ]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        const timeLocation = gl.getUniformLocation(program, "u_time");
        const mouseLocation = gl.getUniformLocation(program, "u_mouse");

        let mouseX = 0, mouseY = 0;
        let targetMouseX = 0, targetMouseY = 0;
        window.addEventListener('mousemove', (e) => {
            targetMouseX = e.clientX;
            targetMouseY = window.innerHeight - e.clientY;
        });

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function renderGL(time) {
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;
            
            gl.uniform1f(timeLocation, time * 0.001);
            gl.uniform2f(mouseLocation, mouseX, mouseY);

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            requestAnimationFrame(renderGL);
        }
        requestAnimationFrame(renderGL);
    }
}

// ==========================================================
// 1. SMOOTH SCROLLING (LENIS)
// ==========================================================
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);


// ==========================================================
// 2. MAGNÉTICO & CURSOR GSAP (OVERDRIVE)
// ==========================================================

// Configuração do motor do GSAP para otimização do cursor
gsap.registerPlugin(ScrollTrigger);

const cursor = document.querySelector('.cursor');
const magnetics = document.querySelectorAll('[data-magnetic]');

// Otimização performática via quickTo do GSAP
const xTo = gsap.quickTo(cursor, "x", {duration: 0.15, ease: "power3"});
const yTo = gsap.quickTo(cursor, "y", {duration: 0.15, ease: "power3"});

window.addEventListener('mousemove', (e) => {
    // Esconder cursor se touch, mostrar se mouse
    if(cursor.style.opacity === '0') cursor.style.opacity = '1';
    
    xTo(e.clientX);
    yTo(e.clientY);
});

// Física em molas para elementos magnéticos
magnetics.forEach((el) => {
    // Adicionar hover do cursor para estourar tamanho
    el.addEventListener('mouseenter', () => {
        cursor.classList.add('active');
        gsap.to(el, { scale: 1.05, duration: 0.3, ease: 'power3.out' });
    });
    
    el.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
        gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    });

    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        
        // Intensidade do Imã
        const magneticPullX = distX * 0.4; 
        const magneticPullY = distY * 0.4;
        
        gsap.to(el, {
            x: magneticPullX,
            y: magneticPullY,
            duration: 0.4,
            ease: "power2.out"
        });
    });
});


// ==========================================================
// 3. SCROLLTRIGGER ANIMATIONS
// ==========================================================

// Atualizar o motor do GSAP quando lenis rolar
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Revelações "Fade Up" usando máscara
const fadeUps = document.querySelectorAll('.fade-up');

fadeUps.forEach(element => {
    gsap.fromTo(element, 
        { 
            y: 60,
            opacity: 0
        },
        {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power4.out",
            scrollTrigger: {
                trigger: element,
                start: "top 90%", // Anima quando o topo bater em 90% da altura da tela
                toggleActions: "play reverse play reverse" // Da play quando aparece, reverte quando sobe sumindo
            }
        }
    );
});



// ==========================================================
// 4. I18N - INTERNATIONALIZATION
// ==========================================================
const translations = {
    pt: {
        'nav.home': 'Home',
        'nav.about': 'Sobre',
        'nav.stacks': 'Stacks',
        'nav.projects': 'Projetos',
        'nav.contact': 'Contato',
        'home.subtitle': 'Desenvolvedor Full Stack',
        'home.action': 'Ver Projetos',
        'home.manifesto': '"Arquitetando soluções ponta a ponta que unem interfaces impecáveis a backends escaláveis para a nova era da web."',
        'about.title': 'Sobre',
        'about.desc': 'Sou um Desenvolvedor Full Stack orientado para resultados, apaixonado por construir plataformas SaaS e integrar Inteligência Artificial. Com grande experiência em React.js, Next.js, Node.js e orquestração de APIs robustas usando bancos SQL e NoSQL. Meu objetivo é arquitetar soluções ponta a ponta que combinem uma interface incrível com performance e escalabilidade excepcionais.',
        'about.resume': 'Currículo',
        'stacks.title': 'Stacks',
        'projects.title': 'Projetos',
        'projects.ixamina.desc': 'Plataforma SaaS Médica End-to-End inovadora. Integrada à Inteligência Artificial do Google Gemini, gera Laudos Clínicos de Hemogramas, Raios-X e ECGs em segundos, com infraestrutura de limites de uso, alertas de urgências e Painel Administrativo em tempo real.',
        'projects.ixamina.link': 'Visite',
        'projects.taskflow.desc': 'Plataforma Kanban completa com API REST em Java 21 e Spring Boot 3.5. Inclui segurança com Spring Security e JWT, upload de avatares com Amazon S3, banco relacional PostgreSQL, e infraestrutura elástica na nuvem AWS via ECS Fargate, ECR e Load Balancer (ALB).',
        'projects.taskflow.link': 'Código Fonte',
        'contact.title': 'Entre em Contato.',
        'contact.name': 'Seu Nome',
        'contact.email': 'Seu Email',
        'contact.message': 'Sua Mensagem',
        'contact.send': 'Enviar',
        'footer.rights': 'Todos os direitos reservados.',
        'thanks.title': 'Mensagem Enviada!',
        'thanks.desc': 'Obrigado por entrar em contato. Retornarei o mais breve possível.',
        'thanks.back': 'Voltar para o Início'
    },
    en: {
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.stacks': 'Stacks',
        'nav.projects': 'Projects',
        'nav.contact': 'Contact',
        'home.subtitle': 'Full Stack Developer',
        'home.subtitle': 'Full Stack Developer',
        'home.action': 'Projects',
        'home.manifesto': '"Architecting end-to-end solutions that merge impeccable interfaces with scalable backends for the new web era."',
        'about.title': 'About',
        'about.desc': 'I am a results-driven Full Stack Developer passionate about building SaaS platforms and integrating Artificial Intelligence. Highly experienced with React.js, Next.js, Node.js and orchestrating robust APIs using SQL and NoSQL databases. My goal is to architect end-to-end solutions that combine an amazing interface with outstanding performance and scalability.',
        'about.resume': 'Download CV',
        'stacks.title': 'Stacks',
        'projects.title': 'Projects',
        'projects.ixamina.desc': 'Innovative End-to-End Medical SaaS. Integrated with Google Gemini AI to generate Clinic Reports from Blood Tests, X-Rays, and ECGs in seconds, featuring rate limiting, urgency alerts, and a real-time Admin Panel.',
        'projects.ixamina.link': 'Visit',
        'projects.taskflow.desc': 'Full Kanban platform powered by a REST API built in Java 21 and Spring Boot 3.5. Features security with Spring Security and JWT, avatar uploads with Amazon S3, PostgreSQL database, and cloud infrastructure on AWS utilizing ECS Fargate, ECR, and Application Load Balancer (ALB).',
        'projects.taskflow.link': 'Source Code',
        'contact.title': 'Get in Touch.',
        'contact.name': 'Your Name',
        'contact.email': 'Your Email',
        'contact.message': 'Your Message',
        'contact.send': 'Send',
        'footer.rights': 'All rights reserved.',
        'thanks.title': 'Message Sent!',
        'thanks.desc': 'Thanks for reaching out. I will get back to you as soon as possible.',
        'thanks.back': 'Back to Home'
    }
};

const langPtBtn = document.getElementById('lang-pt');
const langEnBtn = document.getElementById('lang-en');

function setLanguage(lang) {
    if(lang === 'pt') {
        langPtBtn.classList.add('active');
        langEnBtn.classList.remove('active');
    } else {
        langEnBtn.classList.add('active');
        langPtBtn.classList.remove('active');
    }
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if(translations[lang][key]) {
            // Em input labels brutais o texto está nos labels. O placeholder original é espaço.
            if(el.tagName === 'LABEL') {
                el.textContent = translations[lang][key];
            } else {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if(translations[lang][key]) {
            el.setAttribute('title', translations[lang][key]);
        }
    });
    
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en-US');
    
    // Atualizar ScrollTrigger logo após mudar as strings pq pode afetar a altura total
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 100);
}

if(langPtBtn) langPtBtn.addEventListener('click', () => setLanguage('pt'));
if(langEnBtn) langEnBtn.addEventListener('click', () => setLanguage('en'));

const savedLang = localStorage.getItem('lang') || 'pt';
setLanguage(savedLang);

// Active Scrollspy Navbar Custom (Base)
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-center .nav-link');

// Scroll Suave ao clicar no Menu usando Lenis scrollTo
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        lenis.scrollTo(targetId, {
            offset: -100,
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
    });
});

function checkActiveSection() {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('href').includes(current)) {
            li.classList.add('active');
        }
    });
}
window.addEventListener('scroll', checkActiveSection);
