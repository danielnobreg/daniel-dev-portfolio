// --- Background Canvas Effect ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > width || this.x < 0) this.speedX *= -1;
        if (this.y > height || this.y < 0) this.speedY *= -1;
    }
    draw(isDark) {
        ctx.fillStyle = isDark ? `rgba(0, 240, 255, 0.5)` : `rgba(2, 102, 204, 0.4)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    const numParticles = Math.min(window.innerWidth / 12, 120);
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(isDark);
        
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                ctx.beginPath();
                ctx.strokeStyle = isDark ? `rgba(0, 240, 255, ${0.1 - distance/1200})` : `rgba(2, 102, 204, ${0.1 - distance/1200})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();


// --- Scroll Reveal Animation ---
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const baseObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.section-reveal').forEach(section => {
    baseObserver.observe(section);
});


// --- Active Navbar Scroll Spy ---
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('href').includes(current)) {
            li.classList.add('active');
        }
    });
});


// --- Theme Toggle ---
const themeToggleBtn = document.getElementById('theme-toggle');

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

themeToggleBtn.addEventListener('click', toggleTheme);


// --- Language Toggle (i18n) ---
const translations = {
    pt: {
        'nav.home': 'Home',
        'nav.about': 'Sobre',
        'nav.stacks': 'Stacks',
        'nav.projects': 'Projetos',
        'nav.contact': 'Contato',
        'home.greeting': 'Olá, eu sou',
        'home.subtitle': 'Desenvolvedor Full Stack',
        'home.action': 'Ver Projetos',
        'about.title': 'Sobre Mim',
        'about.desc': 'Sou um Desenvolvedor Full Stack orientado para resultados, apaixonado por construir plataformas SaaS e integrar Inteligência Artificial. Com grande experiência em React.js, Next.js, Node.js e orquestração de APIs robustas usando bancos SQL e NoSQL. Meu objetivo é arquitetar soluções ponta a ponta que combinem uma interface incrível com performance e escalabilidade excepcionais.',
        'about.resume': 'Baixar CV',
        'stacks.title': 'Minhas Stacks',
        'projects.title': 'Meus Projetos',
        'projects.admin.desc': 'Melhorias completas de UI/UX em painel de administração. Inclusão de telas de carregamento customizadas, histórico global com funcionalidade undo e indicadores de força de senha para maior segurança e facilidade de uso.',
        'projects.codeleap.desc': 'Configuração e desenvolvimento back-end de um projeto avaliativo utilizando Django. Arquitetura robusta criada do zero, englobando funcionalidades principais e bônus exigidas no escopo da aplicação.',
        'projects.ixamina.desc': 'Plataforma desenvolvida para sanar casos de uso específicos de negócio. Integrada a serviços modernos para entrega de valor com performance garantida.',
        'contact.title': 'Entre em Contato',
        'contact.name': 'Seu Nome',
        'contact.email': 'Seu Email',
        'contact.message': 'Sua Mensagem',
        'contact.send': 'Enviar Mensagem',
        'footer.rights': 'Todos os direitos reservados.'
    },
    en: {
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.stacks': 'Stacks',
        'nav.projects': 'Projects',
        'nav.contact': 'Contact',
        'home.greeting': 'Hi, I am',
        'home.subtitle': 'Full Stack Developer',
        'home.action': 'View Projects',
        'about.title': 'About Me',
        'about.desc': 'I am a results-driven Full Stack Developer passionate about building SaaS platforms and integrating Artificial Intelligence. Highly experienced with React.js, Next.js, Node.js and orchestrating robust APIs using SQL and NoSQL databases. My goal is to architect end-to-end solutions that combine an amazing interface with outstanding performance and scalability.',
        'about.resume': 'Download CV',
        'stacks.title': 'My Stacks',
        'projects.title': 'My Projects',
        'projects.admin.desc': 'Complete UI/UX enhancements on an admin panel. Added custom loading screens, global history with undo functionality, and password strength indicators for improved security and usability.',
        'projects.codeleap.desc': 'Backend setup and development of an evaluation project using Django. Robust architecture built from scratch, encompassing main features and bonuses required by the application scope.',
        'projects.ixamina.desc': 'Platform developed to address specific business use cases. Integrated with modern services for guaranteed performance and value delivery.',
        'contact.title': 'Get in Touch',
        'contact.name': 'Your Name',
        'contact.email': 'Your Email',
        'contact.message': 'Your Message',
        'contact.send': 'Send Message',
        'footer.rights': 'All rights reserved.'
    }
};

const langPtBtn = document.getElementById('lang-pt');
const langEnBtn = document.getElementById('lang-en');

function setLanguage(lang) {
    // Atualiza botões
    if(lang === 'pt') {
        langPtBtn.classList.add('active');
        langEnBtn.classList.remove('active');
    } else {
        langEnBtn.classList.add('active');
        langPtBtn.classList.remove('active');
    }
    
    // Atualiza textos
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Atualiza placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if(translations[lang][key]) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });

    // Atualiza attributos title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if(translations[lang][key]) {
            el.setAttribute('title', translations[lang][key]);
        }
    });
    
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en-US');
}

langPtBtn.addEventListener('click', () => setLanguage('pt'));
langEnBtn.addEventListener('click', () => setLanguage('en'));

// Set initial language
const savedLang = localStorage.getItem('lang') || 'pt';
setLanguage(savedLang);

// --- 3D Mouse Tracking Tilt Effect ---
const tiltImages = document.querySelectorAll('.project-img');

tiltImages.forEach(img => {
    img.addEventListener('mousemove', e => {
        const rect = img.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;  
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Tilt intensity for the image
        const rotateX = ((y - centerY) / centerY) * -12; 
        const rotateY = ((x - centerX) / centerX) * 12;
        
        img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        img.style.boxShadow = `-15px 15px 30px rgba(0,0,0,0.6), 0 0 15px rgba(0, 240, 255, 0.15)`;
    });
    
    img.addEventListener('mouseleave', () => {
        img.style.transition = 'transform 0.5s ease-out, box-shadow 0.5s ease-out';
        img.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        img.style.boxShadow = `none`;
        
        setTimeout(() => {
            img.style.transition = '';
        }, 500);
    });
});
