// ==========================================================
// 0. INTERACTIVE INK/CHARCOAL CANVAS TRAIL (DRAWING PHYSICS)
// ==========================================================
const inkCanvas = document.getElementById("ink-canvas");
if (inkCanvas) {
    const ctx = inkCanvas.getContext("2d");
    let points = [];

    function resizeCanvas() {
        inkCanvas.width = window.innerWidth;
        inkCanvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Capture mouse movements to append points to trail
    window.addEventListener("mousemove", (e) => {
        points.push({
            x: e.clientX,
            y: e.clientY,
            age: 0,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 5 + 3
        });
    });

    function drawInkTrail() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)"; // Creates trailing motion fade overlay
        ctx.fillRect(0, 0, inkCanvas.width, inkCanvas.height);
        
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw charcoal sketchy particles/lines
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            p.x += p.vx;
            p.y += p.vy;
            p.age += 1;

            const alpha = Math.max(0, 1 - p.age / 80);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - p.age / 80), 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw connected sketched line segment
        if (points.length > 2) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 2;
            ctx.moveTo(points[0].x, points[0].y);
            
            // Render smooth quadratic curves between drawing nodes
            for (let i = 1; i < points.length - 2; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.stroke();
        }

        points = points.filter(p => p.age < 80);
        requestAnimationFrame(drawInkTrail);
    }
    requestAnimationFrame(drawInkTrail);
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
// 2. MAGNÉTICO & CURSOR GSAP (TACTILE MICRO-MOTION)
// ==========================================================
gsap.registerPlugin(ScrollTrigger);

const cursor = document.querySelector('.cursor');
const magnetics = document.querySelectorAll('[data-magnetic]');

const xTo = gsap.quickTo(cursor, "x", {duration: 0.15, ease: "power3"});
const yTo = gsap.quickTo(cursor, "y", {duration: 0.15, ease: "power3"});

window.addEventListener('mousemove', (e) => {
    if (cursor) {
        if(cursor.style.opacity === '0') cursor.style.opacity = '1';
        xTo(e.clientX);
        yTo(e.clientY);
    }
});

magnetics.forEach((el) => {
    el.addEventListener('mouseenter', () => {
        if (cursor) cursor.classList.add('active');
        gsap.to(el, { scale: 1.03, duration: 0.3, ease: 'power3.out' });
    });
    
    el.addEventListener('mouseleave', () => {
        if (cursor) cursor.classList.remove('active');
        gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });

    el.addEventListener('mousedown', () => {
        gsap.to(el, { scale: 0.96, duration: 0.1, ease: 'power3.out' });
    });

    el.addEventListener('mouseup', () => {
        gsap.to(el, { scale: 1.03, duration: 0.3, ease: 'power3.out' });
    });

    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        
        // Dynamic magnetic spring physics
        const magneticPullX = distX * 0.35; 
        const magneticPullY = distY * 0.35;
        
        gsap.to(el, {
            x: magneticPullX,
            y: magneticPullY,
            duration: 0.4,
            ease: "power2.out"
        });
    });
});

// ==========================================================
// 3. GSAP HORIZONTAL PAN (LANDO NORRIS STYLE)
// ==========================================================
const horizontalWrapper = document.getElementById("horizontal-wrapper");
const panels = gsap.utils.toArray("#horizontal-wrapper .panel");
let scrollTriggerInstance;

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

function initScrollAnimation() {
    // Clean up if already exists to prevent duplication
    if (scrollTriggerInstance) {
        scrollTriggerInstance.kill();
    }

    if (window.innerWidth > 1024 && horizontalWrapper && panels.length > 0) {
        // Compute travel distance
        const totalPanX = -100 * (panels.length - 1);
        
        scrollTriggerInstance = ScrollTrigger.create({
            trigger: horizontalWrapper,
            pin: true,
            scrub: 1,
            // Horizontal panning matches wrapper width
            end: () => "+=" + horizontalWrapper.offsetWidth,
            animation: gsap.to(panels, {
                xPercent: totalPanX,
                ease: "none"
            }),
            snap: {
                snapTo: 1 / (panels.length - 1),
                duration: { min: 0.2, max: 0.5 },
                delay: 0.1,
                ease: "power2.inOut"
            },
            onUpdate: self => {
                checkActivePanel(self.progress);
            }
        });
    } else {
        // Reset panels translation on mobile viewports
        gsap.set(panels, { xPercent: 0 });
    }
}

// Map Snap progress to navigation link highlighting
function checkActivePanel(progress) {
    const navLinks = document.querySelectorAll('.nav-center .nav-link');
    const segment = 1 / (panels.length - 1);
    const activeIndex = Math.min(
        panels.length - 1,
        Math.max(0, Math.round(progress / segment))
    );

    navLinks.forEach((link, idx) => {
        link.classList.remove('active');
        if (idx === activeIndex || (activeIndex >= 3 && activeIndex <= 5 && idx === 3) || (activeIndex === 6 && idx === 4)) {
            // Projects are panels 3, 4, 5. Contact is panel 6.
            if (idx === 3 && activeIndex >= 3 && activeIndex <= 5) {
                link.classList.add('active');
            } else if (idx === 4 && activeIndex === 6) {
                link.classList.add('active');
            } else if (idx === idx && activeIndex === idx) {
                link.classList.add('active');
            }
        }
    });
}

// Initial load
window.addEventListener("load", initScrollAnimation);
window.addEventListener("resize", initScrollAnimation);

// Active Scrollspy Navbar for Mobile
function checkActiveSectionMobile() {
    if (window.innerWidth <= 1024) {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-center .nav-link');
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
}
window.addEventListener('scroll', checkActiveSectionMobile);

// Scroll smooth action on navbar click
const navLinks = document.querySelectorAll('.nav-center .nav-link');
navLinks.forEach((link, idx) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        
        if (window.innerWidth > 1024 && scrollTriggerInstance) {
            // Resolve section scroll mapping:
            // Home (idx 0) -> 0%
            // Sobre (idx 1) -> 1/6 progress
            // Stacks (idx 2) -> 2/6 progress
            // Projetos (idx 3) -> 3/6 progress (takes panel index 3)
            // Contato (idx 4) -> 6/6 progress (takes panel index 6)
            let targetPanelIdx = idx;
            if (idx === 3) targetPanelIdx = 3; // First project iXamina
            if (idx === 4) targetPanelIdx = 6; // Contact Form
            
            const targetScrollY = scrollTriggerInstance.start + 
                (targetPanelIdx / (panels.length - 1)) * (scrollTriggerInstance.end - scrollTriggerInstance.start);
            
            lenis.scrollTo(targetScrollY, {
                duration: 1.5,
                ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        } else {
            lenis.scrollTo(targetId, {
                offset: -100,
                duration: 1.5,
                ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        }
    });
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
        'projects.ixamina.link': 'Acesso Antecipado',
        'projects.taskflow.desc': 'Plataforma Kanban completa com API REST em Java 21 e Spring Boot 3.5. Inclui segurança com Spring Security e JWT, upload de avatares com Amazon S3, banco relacional PostgreSQL, e infraestrutura elástica na nuvem AWS via ECS Fargate, ECR e Load Balancer (ALB).',
        'projects.taskflow.link': 'Código Fonte',
        'projects.rodizzio.desc': 'Aplicação gamificada em tempo real para acompanhar pontuações e consumo em rodízios. Desenvolvida em Flutter e Firebase, conta com sincronização de lobby, votação de fim de rodada e roasts com estimativa de calorias via Gemini API.',
        'projects.rodizzio.link': 'Visite a Plataforma',
        'contact.title': 'Fale Comigo.',
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
        'home.action': 'View Projects',
        'home.manifesto': '"Architecting end-to-end solutions that merge impeccable interfaces with scalable backends for the new web era."',
        'about.title': 'About',
        'about.desc': 'I am a results-driven Full Stack Developer passionate about building SaaS platforms and integrating Artificial Intelligence. Highly experienced with React.js, Next.js, Node.js and orchestrating robust APIs using SQL and NoSQL databases. My goal is to architect end-to-end solutions that combine an amazing interface with outstanding performance and scalability.',
        'about.resume': 'Download CV',
        'stacks.title': 'Stacks',
        'projects.title': 'Projects',
        'projects.ixamina.desc': 'Innovative End-to-End Medical SaaS. Integrated with Google Gemini AI to generate Clinic Reports from Blood Tests, X-Rays, and ECGs in seconds, featuring rate limiting, urgency alerts, and a real-time Admin Panel.',
        'projects.ixamina.link': 'Early Access',
        'projects.taskflow.desc': 'Full Kanban platform powered by a REST API built in Java 21 and Spring Boot 3.5. Features security with Spring Security and JWT, avatar uploads with Amazon S3, PostgreSQL database, and cloud infrastructure on AWS utilizing ECS Fargate, ECR, and Application Load Balancer (ALB).',
        'projects.taskflow.link': 'Source Code',
        'projects.rodizzio.desc': 'Real-time gamified app to track scores and food consumption at rodízios. Built with Flutter and Firebase, featuring lobby synchronization, majority vote session end, and Gemini AI-generated roasts/calorie estimations.',
        'projects.rodizzio.link': 'Visit Platform',
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
        if (langPtBtn) langPtBtn.classList.add('active');
        if (langEnBtn) langEnBtn.classList.remove('active');
    } else {
        if (langEnBtn) langEnBtn.classList.add('active');
        if (langPtBtn) langPtBtn.classList.remove('active');
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
    
    setTimeout(() => {
        ScrollTrigger.refresh();
        initScrollAnimation();
    }, 150);
}

if(langPtBtn) langPtBtn.addEventListener('click', () => setLanguage('pt'));
if(langEnBtn) langEnBtn.addEventListener('click', () => setLanguage('en'));

const savedLang = localStorage.getItem('lang') || 'pt';
setLanguage(savedLang);
