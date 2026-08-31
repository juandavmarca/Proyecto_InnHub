import { useState } from "react";
import { useNavigate } from "react-router-dom";
/* eslint-disable no-unused-vars */

import ConfirmDialog from "../components/ConfirmDialog";

const homeLogo = "http://localhost/ERPInnHub/backend/uploads/logo.png";

const galleryImages = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512915921949-053ae66b30b4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501117716987-c8e5d6f35a0e?auto=format&fit=crop&w=1200&q=80",
];

const _services = [
  { name: "WiFi Premium", icon: "📶", description: "Conexión rápida en todas las áreas del hotel." },
  { name: "Spa & Relax", icon: "🌿", description: "Zona de spa para desconectar y recargar energías." },
  { name: "Parqueadero", icon: "🚗", description: "Estacionamiento seguro y cómodo para tu vehículo." },
  { name: "Gimnasio", icon: "🏋️", description: "Espacio equipado para mantener tu rutina fitness." },
  { name: "Comedor", icon: "🍽️", description: "Desayunos y cenas con sabores locales e internacionales." },
  { name: "Zona Pet", icon: "🐾", description: "Ambiente acogedor para huéspedes con mascotas." },
];

const rooms = [
  {
    title: "Habitación Económica",
    category: "economica",
    price: "$180.000 COP / noche",
    description: "Perfecta para viajeros prácticos que buscan confort y ahorro.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    button: "Reservar ahora",
  },
  {
    title: "Habitación Premium",
    category: "premium",
    price: "$280.000 COP / noche",
    description: "Espacios amplios con diseño elegante y atención personalizada.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    button: "Ver detalles",
  },
  {
    title: "Habitación Económica - Doble",
    category: "economica",
    price: "$200.000 COP / noche",
    description: "Opción económica con dos camas, ideal para parejas o amigos.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    button: "Reservar ahora",
  },
];

const _testimonials = [
  {
    name: "María González",
    location: "Madrid, España",
    quote: "Una experiencia increíble. El personal es muy amable y las instalaciones impecables.",
  },
  {
    name: "John Smith",
    location: "New York, USA",
    quote: "El mejor hotel en el que me he hospedado. La habitación era espaciosa y la vista espectacular.",
  },
  {
    name: "Sophie Laurent",
    location: "Paris, France",
    quote: "Perfecto para unas vacaciones relajantes. El spa es maravilloso y la comida excelente.",
  },
];

function Home() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showRooms, setShowRooms] = useState(false);
  const [showAdminAlert, setShowAdminAlert] = useState(false);

  const updateAdults = (value) => {
    setAdults((current) => Math.max(1, current + value));
  };

  const updateChildren = (value) => {
    setChildren((current) => Math.max(0, current + value));
  };

  const handleOpenExperienceModal = () => {
    setShowExperienceModal(true);
    setActiveSlide(0);
  };

  const handleCloseExperienceModal = () => {
    setShowExperienceModal(false);
  };

  const handleNextSlide = () => {
    setActiveSlide((current) => (current + 1) % galleryImages.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  };

  const [activeRoom, setActiveRoom] = useState(null);

  const handleOpenRoomModal = (room) => {
    setActiveRoom(room);
  };

  const handleCloseRoomModal = () => {
    setActiveRoom(null);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <img src={homeLogo} alt="Hotel Valencia logo" className="home-logo-image" />
          <span className="home-subtitle">Hotel Ejecutivo</span>
        </div>
        <nav className="home-nav">
          <a href="#hero">Inicio</a>
          {/* <a href="#services">Servicios</a> */}
          <a href="#rooms">Habitaciones</a>
          {/* <a href="#reviews">Reseñas</a> */}
          <a href="#contact">Contacto</a>
        </nav>
        <div className="home-actions">
          <button
            type="button"
            className="btn btn-register"
            onClick={() => setShowAdminAlert(true)}
          >
            Administración
          </button>
          <button className="btn btn-lang">ES</button>
        </div>
      </header>

      <section className="hero-section" id="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">Bienvenido a Sonsón</span>
            <br />
            <span className="smsprincipal">Elegancia, confort y servicio excepcional en un solo lugar.</span>
            
            <div className="hero-buttons">
              <a href="#rooms" className="btn btn-cta">
                Reserva ya
              </a>
             
            </div>
          </div>

          <aside className="hero-booking-card">
            <div className="booking-card-header">
              <span>Encuentra tu habitación ideal</span>
              <strong>Fechas y disponibilidad</strong>
            </div>
            <div className="booking-row">
              <label>Entrada</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="booking-row">
              <label>Salida</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="booking-row booking-row-inline">
              <div>
                <label>Adultos</label>
                <div className="counter">
                  <button type="button" onClick={() => updateAdults(-1)}>-</button>
                  <span>{adults}</span>
                  <button type="button" onClick={() => updateAdults(1)}>+</button>
                </div>
              </div>
              <div>
                <label>Niños</label>
                <div className="counter">
                  <button type="button" onClick={() => updateChildren(-1)}>-</button>
                  <span>{children}</span>
                  <button type="button" onClick={() => updateChildren(1)}>+</button>
                </div>
              </div>
            </div>
            <button className="btn btn-book">Buscar habitación</button>
            
          </aside>
        </div>
      </section>

      <section className="feature-strip" aria-label="Ventajas del hotel">
        <div className="feature-strip-grid">
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🔔</div>
            <div className="feature-copy">
              <h3>Servicio 24/7</h3>
              <p>Estamos siempre disponibles para ti.</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🛏️</div>
            <div className="feature-copy">
              <h3>Comodidad</h3>
              <p>Habitaciones diseñadas para tu descanso.</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🛡️</div>
            <div className="feature-copy">
              <h3>Seguridad</h3>
              <p>Tu tranquilidad es nuestra prioridad.</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">📍</div>
            <div className="feature-copy">
              <h3>Ubicación</h3>
              <p>En el corazón de la ciudad, cerca de todo.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="value-cards" aria-label="Beneficios del hotel">
        <article className="value-card">
          <h3>Ubicación estratégica</h3>
          <p>Acceso fácil a sitios turísticos, restaurantes y transporte local.</p>
        </article>

        <article className="value-card">
          <h3>Atención 24/7</h3>
          <p>Soporte para reservas, consultas y servicios personalizados.</p>
        </article>

        <button type="button" className="value-card value-card-button" onClick={handleOpenExperienceModal}>
          <h3>Experiencias únicas</h3>
          <p>Planes especiales, cenas temáticas y actividades de bienestar.</p>
        </button>
      </section>

      {/* <section className="services-section home-section" id="services">
        <div className="section-title">
          <span>Servicios exclusivos</span>
          <h2>Todo lo que necesitas para una estadía inolvidable</h2>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <article key={service.name} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section> */}

      <section className="rooms-section home-section" id="rooms">
        <div className="section-title align-left">
          <span>Habitaciones</span>
          <h2>Encuentra el espacio perfecto para tu estadía</h2>
        </div>
        <div className="room-categories">
          <button
            type="button"
            className={`category-card image ${selectedCategory === 'economica' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('economica');
              setShowRooms(true);
              const el = document.getElementById('rooms');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ backgroundImage: `url(${rooms.find(r => r.category === 'economica')?.image})` }}
          >
            <div className="category-overlay">
              <h3>Habitaciones Económicas</h3>
              <p>Opciones cómodas y accesibles.</p>
            </div>
          </button>

          <button
            type="button"
            className={`category-card image ${selectedCategory === 'premium' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('premium');
              setShowRooms(true);
              const el = document.getElementById('rooms');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ backgroundImage: `url(${rooms.find(r => r.category === 'premium')?.image})` }}
          >
            <div className="category-overlay">
              <h3>Habitaciones Premium</h3>
              <p>Confort superior y servicios exclusivos.</p>
            </div>
          </button>
        </div>

        {showRooms && (
          <>
            <div className="rooms-controls" style={{display:'flex',gap:'0.8rem',justifyContent:'flex-end',marginBottom:'1rem'}}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setSelectedCategory(null); }}
              >
                Ver todas
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setShowRooms(false);
                  const el = document.getElementById('hero');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Regresar al inicio
              </button>
            </div>

            <div className="rooms-grid">
              {(selectedCategory ? rooms.filter(r => r.category === selectedCategory) : rooms).map((room) => (
              <article key={room.title} className="room-card">
                <button
                  type="button"
                  className="room-image"
                  style={{ backgroundImage: `url(${room.image})` }}
                  onClick={() => handleOpenRoomModal(room)}
                >
                  <span className="room-image-overlay">
                    <span className="room-image-icon">
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </span>
                  </span>
                </button>
                <div className="room-content">
                  <h3>{room.title}</h3>
                  <p>{room.description}</p>
                  <div className="room-meta">
                    <span>{room.price}</span>
                    <button className="btn btn-secondary">{room.button}</button>
                  </div>
                </div>
              </article>
            ))}
            </div>
          </>
        )}
      </section>

      {/* <section className="reviews-section home-section" id="reviews">
        <div className="section-title">
          <span>Reseñas reales</span>
          <h2>Lo que dicen nuestros huéspedes</h2>
        </div>
        <div className="reviews-grid">
          {testimonials.map((review) => (
            <article key={review.name} className="review-card">
              <div className="review-avatar">{review.name.charAt(0)}</div>
              <div>
                <strong>{review.name}</strong>
                <span>{review.location}</span>
              </div>
              <p>“{review.quote}”</p>
              <div className="rating">★★★★★</div>
            </article>
          ))}
        </div>
      </section> */}

      {showExperienceModal && (
        <div className="modal-backdrop modal-backdrop-show" onClick={handleCloseExperienceModal}>
          <div className="experience-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={handleCloseExperienceModal}>
              ×
            </button>
            <div className="experience-carousel">
              <button className="carousel-control prev" type="button" onClick={handlePrevSlide}>
                ‹
              </button>
              <div className="carousel-slide" style={{ backgroundImage: `url(${galleryImages[activeSlide]})` }} />
              <button className="carousel-control next" type="button" onClick={handleNextSlide}>
                ›
              </button>
            </div>
            <div className="carousel-indicators">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`carousel-indicator ${index === activeSlide ? "active" : ""}`}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeRoom && (
        <div className="modal-backdrop modal-backdrop-show" onClick={handleCloseRoomModal}>
          <div className="room-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={handleCloseRoomModal}>
              ×
            </button>
            <div className="room-modal-grid">
              <div className="room-modal-video">
                <video controls src={activeRoom.video} />
              </div>
              <div className="room-modal-details">
                <h2>{activeRoom.title}</h2>
                <p>{activeRoom.description}</p>
                <p className="room-modal-price">{activeRoom.price}</p>
                <button className="btn btn-secondary">{activeRoom.button}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={showAdminAlert}
        title="Espacio administrativo"
        message="¿Deseas continuar? Este espacio es solo para personal administrativo."
        confirmText="Continuar"
        cancelText="Cancelar"
        onConfirm={() => {
          setShowAdminAlert(false);
          navigate("/login");
        }}
        onCancel={() => setShowAdminAlert(false)}
      />

      <footer className="home-footer" id="contact">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={homeLogo} alt="Hotel Valencia logo" className="footer-logo" />
            <div>
              <span className="footer-brand-name">Hotel Valencia</span>
              <p>Hospitalidad elegante en Sonsón, donde cada detalle está pensado para tu descanso.</p>
            </div>
          </div>

          <div className="footer-links">
            <h4>Explora</h4>
            <ul>
              <li><a href="#hero">Inicio</a></li>
              <li><a href="#rooms">Habitaciones</a></li>
              <li><a href="#contact">Contacto</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contacto</h4>
            <p>📍 Sonsón, Antioquia</p>
            <p>📞 +57 300 123 4567</p>
            <p>✉️ info@hotelvalencia.com</p>
            <p>🕒 Recepción 24/7</p>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-copy">
          <span>© 2026 Hotel Valencia.</span>
          <span>Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
