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
// 3. GSAP HORIZONTAL PAN & DYNAMIC SCROLL ANIMATIONS
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
        // Pin projects container and translate horizontal wrapper
        scrollTriggerInstance = ScrollTrigger.create({
            trigger: "#projects",
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => "+=" + (horizontalWrapper.scrollWidth - window.innerWidth),
            animation: gsap.to(horizontalWrapper, {
                x: () => -(horizontalWrapper.scrollWidth - window.innerWidth),
                ease: "none"
            }),
            invalidateOnRefresh: true
        });

        // 1. ABOUT PANEL SCROLL ANIMATIONS (Profile image organic rotation & translation on vertical scroll)
        gsap.fromTo("#about .about-image", 
            { rotate: -8, scale: 0.85 },
            {
                rotate: 4,
                scale: 1.05,
                scrollTrigger: {
                    trigger: "#about",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            }
        );
        gsap.fromTo("#about .about-desc", 
            { y: 60, opacity: 0.5 },
            {
                y: -60,
                opacity: 1,
                scrollTrigger: {
                    trigger: "#about",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            }
        );

        // 2. STACKS PANEL ANIMATIONS (Bento cells stagger scale-in zoom on vertical scroll)
        gsap.fromTo("#stacks .bento-cell",
            { scale: 0.75, opacity: 0.2, rotate: -2 },
            {
                scale: 1,
                opacity: 1,
                rotate: 0,
                stagger: 0.05,
                scrollTrigger: {
                    trigger: "#stacks",
                    start: "top bottom",
                    end: "center center",
                    scrub: true
                }
            }
        );

        // 3. PROJECTS SCROLL INTERACTIONS (Scale zoom and vertical parallax text flow on horizontal scroll)
        panels.forEach((panel) => {
            const visual = panel.querySelector(`.project-visual`);
            const info = panel.querySelector(`.project-info`);
            
            if (visual) {
                gsap.fromTo(visual,
                    { scale: 0.75, rotate: -4 },
                    {
                        scale: 1.08,
                        rotate: 2,
                        scrollTrigger: {
                            trigger: panel,
                            containerAnimation: scrollTriggerInstance.animation,
                            start: "left right",
                            end: "right left",
                            scrub: true
                        }
                    }
                );
            }

            if (info) {
                gsap.fromTo(info,
                    { y: 100, opacity: 0.6 },
                    {
                        y: -100,
                        opacity: 1,
                        scrollTrigger: {
                            trigger: panel,
                            containerAnimation: scrollTriggerInstance.animation,
                            start: "left right",
                            end: "right left",
                            scrub: true
                        }
                    }
                );
            }
        });
    } else {
        // Reset panels translation and animation states on mobile viewports
        gsap.set(horizontalWrapper, { x: 0 });
        gsap.set("#about .about-image", { rotate: -2, scale: 1 });
        gsap.set("#about .about-desc", { y: 0, opacity: 1 });
        gsap.set("#stacks .bento-cell", { scale: 1, opacity: 1, rotate: 0 });
        gsap.set(".project-visual", { scale: 1, rotate: 0 });
        gsap.set(".project-info", { y: 0, opacity: 1 });
    }
}

// Initial load
window.addEventListener("load", initScrollAnimation);
window.addEventListener("resize", initScrollAnimation);

// Active Scrollspy Navbar for both Desktop & Mobile (based on vertical elements)
function checkActiveSection() {
    const sections = document.querySelectorAll('main > section');
    const navLinks = document.querySelectorAll('.nav-center .nav-link');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
}
window.addEventListener('scroll', checkActiveSection);

// Scroll smooth action on navbar click
const navLinks = document.querySelectorAll('.nav-center .nav-link');
navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        lenis.scrollTo(targetId, {
            offset: 0,
            duration: 1.5,
            ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
    });
});

// ==========================================================
// 4. I18N - INTERNATIONALIZATION & PREMIUM COPYWRITING
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
        'home.manifesto': '"Escrevo código limpo. Desenho sistemas rápidos. Resolvo problemas de ponta a ponta sem firulas."',
        'about.title': 'Sobre',
        'about.desc': 'Sou desenvolvedor Full Stack. Construo APIs eficientes com Node.js e Java Spring Boot, crio frontends rápidos e responsivos com React/Next.js e automatizo infraestruturas na nuvem AWS. Meu foco é entregar software resiliente, com arquitetura limpa e performance pura, resolvendo problemas técnicos sem rodeios.',
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
        'home.manifesto': '"I write clean code. I build fast systems. I solve problems end-to-end without the fluff."',
        'about.title': 'About',
        'about.desc': 'I am a Full Stack developer. I build efficient APIs with Node.js and Java Spring Boot, create fast, responsive frontends with React/Next.js, and automate AWS cloud infrastructures. My focus is delivering resilient software with clean architecture and pure performance, solving technical problems straight to the point.',
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
